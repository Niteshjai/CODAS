import { describe, it, expect, beforeAll, afterAll } from '../testFramework';
import { familyVault, FamilyError } from '../../src/family/familyVault';
import { familyAggregator } from '../../src/family/familyAggregator';
import { familyGoals } from '../../src/family/familyGoals';
import { pool } from '../../src/db/connection';
import { encryptPII } from '../../src/utils/encryption';
import crypto from 'crypto';

async function expectFamilyError(fn: () => Promise<unknown>, status: number, messagePart: string) {
  let caught: unknown;
  try { await fn(); } catch (err) { caught = err; }
  expect(caught instanceof FamilyError).toBe(true);
  expect((caught as FamilyError).statusCode).toBe(status);
  expect((caught as FamilyError).message).toContain(messagePart);
}

// Random, valid-looking Indian mobile numbers so parallel runs don't collide
const randomMobile = () => `9${crypto.randomInt(100000000, 999999999)}`;

export function registerFamilyVaultTests() {
  describe('familyVault (multi-user family sharing)', () => {
    const users: Record<'owner' | 'spouse' | 'parent' | 'stranger', { id: string; mobile: string }> = {} as any;
    let vaultId: string;
    let spouseInviteId: string;
    let spouseMemberId: string;

    beforeAll(async () => {
      for (const [key, name] of [['owner', 'Owner Sharma'], ['spouse', 'Priya Sharma'], ['parent', 'Ramesh Sharma'], ['stranger', 'Stranger Rao']] as const) {
        const mobile = randomMobile();
        const res = await pool.query(
          `INSERT INTO users (aadhaar_hash, name_encrypted, mobile_encrypted) VALUES ($1, $2, $3) RETURNING id`,
          [crypto.randomBytes(16).toString('hex'), encryptPII(name), encryptPII(`+91${mobile}`)]
        );
        users[key] = { id: res.rows[0].id, mobile };
      }
      await pool.query(
        `INSERT INTO canonical_assets (user_id, asset_class, institution_name, current_value_paise, has_nominee, is_active)
         VALUES ($1,'BANK_ACCOUNT','HDFC Bank',5000000,true,true), ($1,'MUTUAL_FUND','Axis MF',2000000,false,true)`,
        [users.spouse.id]
      );
    });

    afterAll(async () => {
      const ids = Object.values(users).map(u => u.id).filter(Boolean);
      await pool.query('DELETE FROM family_vaults WHERE primary_user_id = ANY($1)', [ids]);
      await pool.query('DELETE FROM canonical_assets WHERE user_id = ANY($1)', [ids]);
      await pool.query('DELETE FROM family_goal_contributions WHERE user_id = ANY($1)', [ids]);
      for (const id of ids) await pool.query('DELETE FROM users WHERE id = $1', [id]).catch(() => {});
    });

    it('creates a vault whose owner is shown by real name (not "Me")', async () => {
      vaultId = await familyVault.createVault(pool, users.owner.id, 'Sharma Family');
      const again = await familyVault.createVault(pool, users.owner.id, 'Sharma Family');
      expect(again).toBe(vaultId);

      const details = await familyVault.getVaultDetails(pool, users.owner.id);
      expect(details.members.length).toBe(1);
      expect(details.members[0].displayName).toBe('Owner Sharma');
      expect(details.members[0].role).toBe('owner');
      expect(details.viewer.isOwner).toBe(true);
    });

    it('rejects inviting your own number and bad input', async () => {
      await expectFamilyError(() => familyVault.inviteMember(pool, users.owner.id,
        { mobile: users.owner.mobile, name: 'Me Again', relationship: 'spouse' }), 400, 'your own number');
      await expectFamilyError(() => familyVault.inviteMember(pool, users.owner.id,
        { mobile: '1234567890', name: 'Priya', relationship: 'spouse' }), 400, 'valid 10-digit');
    });

    it('invites by mobile without storing the number in plaintext', async () => {
      const res = await familyVault.inviteMember(pool, users.owner.id,
        { mobile: users.spouse.mobile, name: 'Priya', relationship: 'spouse' });
      spouseMemberId = res.memberId;
      expect(res.mobileHint).toBe(`••••${users.spouse.mobile.slice(-4)}`);

      const row = await pool.query('SELECT invited_mobile, invited_mobile_hash, invited_mobile_encrypted FROM family_vault_members WHERE id = $1', [res.memberId]);
      expect(row.rows[0].invited_mobile).toBeNull();
      expect(typeof row.rows[0].invited_mobile_hash).toBe('string');
      expect(row.rows[0].invited_mobile_encrypted).not.toContain(users.spouse.mobile);

      await expectFamilyError(() => familyVault.inviteMember(pool, users.owner.id,
        { mobile: users.spouse.mobile, name: 'Priya', relationship: 'spouse' }), 409, 'already pending');
    });

    it('only members cannot invite; only the invitee sees the invitation', async () => {
      const forStranger = await familyVault.listMyInvitations(pool, users.stranger.id);
      expect(forStranger.length).toBe(0);
      const forSpouse = await familyVault.listMyInvitations(pool, users.spouse.id);
      expect(forSpouse.length).toBe(1);
      expect(forSpouse[0].inviterName).toBe('Owner Sharma');
      expect(forSpouse[0].vaultName).toBe('Sharma Family');
      spouseInviteId = forSpouse[0].inviteId;

      await expectFamilyError(() => familyVault.acceptInvite(pool, users.stranger.id, { inviteId: spouseInviteId }), 403, 'different mobile');
    });

    it('invitee accepts in-app; both sides now see the same vault', async () => {
      const preview = await familyVault.previewInvite(pool, users.spouse.id, { inviteId: spouseInviteId });
      expect(preview.blockedReason).toBeNull();

      const res = await familyVault.acceptInvite(pool, users.spouse.id, { inviteId: spouseInviteId });
      expect(res.vaultId).toBe(vaultId);

      const asSpouse = await familyVault.getVaultDetails(pool, users.spouse.id);
      expect(asSpouse.id).toBe(vaultId);
      expect(asSpouse.viewer.isOwner).toBe(false);
      const ownerRow = asSpouse.members.find((m: any) => m.role === 'owner');
      expect(ownerRow.displayName).toBe('Owner Sharma');
      const me = asSpouse.members.find((m: any) => m.isYou);
      expect(me.displayName).toBe('Priya Sharma');
      expect(me.status).toBe('active');
      // Members never see invite phone hints
      expect(asSpouse.members.every((m: any) => m.mobileHint === null)).toBe(true);

      const token = await pool.query('SELECT invite_token, invited_mobile_encrypted FROM family_vault_members WHERE id = $1', [spouseMemberId]);
      expect(token.rows[0].invite_token).toBeNull();
      expect(token.rows[0].invited_mobile_encrypted).toBeNull();

      await expectFamilyError(() => familyVault.inviteMember(pool, users.spouse.id,
        { mobile: users.parent.mobile, name: 'Ramesh', relationship: 'parent' }), 403, 'Only the vault owner');
      await expectFamilyError(() => familyVault.leaveVault(pool, users.owner.id), 400, 'Close it instead');
    });

    it("combined net worth respects each member's sharing choices", async () => {
      const before = await familyAggregator.getCombinedNetWorth(pool, vaultId, users.owner.id);
      const spouseBefore = before.members.find(m => m.userId === users.spouse.id)!;
      expect(before.memberCount).toBe(2);
      expect(spouseBefore.totalPaise).toBe(7000000);

      await familyVault.updateVisibility(pool, users.spouse.id, { shareMutualFunds: false });
      const after = await familyAggregator.getCombinedNetWorth(pool, vaultId, users.owner.id);
      const spouseAfter = after.members.find(m => m.userId === users.spouse.id)!;
      expect(spouseAfter.byAssetClass.MUTUAL_FUND ?? 0).toBe(0);
      expect(spouseAfter.totalPaise <= spouseBefore.totalPaise).toBe(true);

      await familyVault.updateVisibility(pool, users.spouse.id, { shareTotalNetworth: false });
      const hidden = await familyAggregator.getCombinedNetWorth(pool, vaultId, users.owner.id);
      const spouseHidden = hidden.members.find(m => m.userId === users.spouse.id)!;
      expect(spouseHidden.sharesNothing).toBe(true);
      expect(spouseHidden.totalPaise).toBe(0);

      const drill = await familyAggregator.getMemberAssets(pool, vaultId, users.owner.id, spouseMemberId);
      expect(drill.sharesNothing).toBe(true);
      expect(drill.assets.length).toBe(0);
      await familyVault.updateVisibility(pool, users.spouse.id, { shareTotalNetworth: true, shareMutualFunds: true });
    });

    it('goals: any member creates, contributes; completion is detected', async () => {
      const goalId = await familyGoals.createGoal(pool, vaultId, users.spouse.id, {
        name: 'Goa trip', goalType: 'vacation', targetAmountPaise: 50_000_00,
      });
      await familyGoals.addContribution(pool, vaultId, goalId, users.owner.id, 20_000_00, 'Bonus');
      const done = await familyGoals.addContribution(pool, vaultId, goalId, users.spouse.id, 30_000_00);
      expect(done.completed).toBe(true);

      const goals = await familyGoals.getGoals(pool, vaultId, users.owner.id);
      const g = goals.find((x: any) => x.id === goalId);
      expect(g.status).toBe('completed');
      expect(g.progressPct).toBe(100);
      expect(g.contributions[0].by).toBe('Priya Sharma');
      expect(g.canCancel).toBe(true);

      await expectFamilyError(() => familyGoals.addContribution(pool, vaultId, goalId, users.owner.id, 100_00), 409, 'already completed');
      await expectFamilyError(() => familyGoals.createGoal(pool, vaultId, users.owner.id, {
        name: 'X', goalType: 'vacation', targetAmountPaise: 50_000_00,
      }), 400, 'name');
    });

    it('a member already in a vault cannot join another; leaving works', async () => {
      // Parent creates their own solo vault, then accepts an invite → solo vault is replaced
      await familyVault.createVault(pool, users.parent.id, 'Parent Solo');
      await familyVault.inviteMember(pool, users.owner.id, { mobile: users.parent.mobile, name: 'Ramesh', relationship: 'parent' });
      const inv = (await familyVault.listMyInvitations(pool, users.parent.id))[0];
      const preview = await familyVault.previewInvite(pool, users.parent.id, { inviteId: inv.inviteId });
      expect(preview.replacesOwnVault).toBe(true);
      await familyVault.acceptInvite(pool, users.parent.id, { inviteId: inv.inviteId });
      const solo = await pool.query('SELECT 1 FROM family_vaults WHERE primary_user_id = $1', [users.parent.id]);
      expect(solo.rows.length).toBe(0);

      await familyVault.leaveVault(pool, users.parent.id);
      expect(await familyVault.getVaultDetails(pool, users.parent.id)).toBeNull();
      const feed = await pool.query(`SELECT title FROM family_activity_feed WHERE vault_id = $1 AND activity_type = 'member_left'`, [vaultId]);
      expect(feed.rows.some((r: any) => r.title.includes('Ramesh Sharma left'))).toBe(true);
    });

    it('owner removes a member; removed member loses access', async () => {
      await expectFamilyError(() => familyVault.removeMember(pool, users.spouse.id, spouseMemberId), 404, 'Member not found');
      await familyVault.removeMember(pool, users.owner.id, spouseMemberId);
      expect(await familyVault.getVaultDetails(pool, users.spouse.id)).toBeNull();
      let denied = false;
      try { await familyAggregator.getCombinedNetWorth(pool, vaultId, users.spouse.id); } catch { denied = true; }
      expect(denied).toBe(true);
    });

    it('closing the vault removes it for everyone', async () => {
      await familyVault.closeVault(pool, users.owner.id);
      expect(await familyVault.getVaultDetails(pool, users.owner.id)).toBeNull();
    });
  });
}

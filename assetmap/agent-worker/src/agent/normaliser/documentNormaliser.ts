import { CanonicalAsset } from '../schemas/canonicalAsset'

// ─────────────────────────────────────────────
// Document Normaliser (DigiLocker)
// Maps DigiLocker issued/pulled documents
// to canonical assets. Primarily used to:
//   1. Enrich existing assets with document links
//   2. Create VEHICLE assets from RC documents
//   3. Link land records to existing LAND assets
// ─────────────────────────────────────────────

export function normaliseDocumentData(
  userId: string,
  raw: any
): CanonicalAsset[] {
  const assets: CanonicalAsset[] = []
  if (!raw?.documents) return assets

  for (const doc of raw.documents) {
    const docType = String(doc.docType ?? doc.doctype ?? doc.type ?? '').toUpperCase()

    // RC (Vehicle Registration Certificate) → VEHICLE asset
    if (docType === 'RC' || docType === 'VEHICLE_RC' ||
        docType === 'REGISTRATION_CERTIFICATE') {
      assets.push({
        userId,
        assetClass:         'VEHICLE',
        primarySource:      'digilocker',
        secondarySources:   [],
        sourceRecordIds:    {
          digilocker: doc.uri ?? doc.docId ?? doc.id
        },

        institutionName:    doc.issuedBy ?? doc.issuer ?? 'RTO',
        institutionType:    'RTO',

        currentValuePaise:  Math.round(
          (doc.estimatedValue ?? 0) * 100
        ),
        investedValuePaise: Math.round(
          (doc.purchaseValue ?? 0) * 100
        ),
        gainLossPaise:      0,
        currency:           'INR',

        assetName:          doc.vehicleNumber ?? doc.registrationNumber ??
                            doc.name ?? 'Vehicle',
        assetSubtype:       doc.vehicleClass ?? doc.vehicleType,

        isActive:           true,
        isDormant:          false,
        hasNominee:         false,
        ownershipType:      doc.ownerName ? 'self' : 'unknown',

        openedDate:         doc.registrationDate ?? doc.issueDate,
        valuationDate:      new Date().toISOString().split('T')[0],

        digilockerUri:      doc.uri ?? doc.docUri,
        documentAvailable:  true,
        rawData:            doc,
      })
    }

    // INSURANCE documents → create or enrich INSURANCE_* assets
    else if (docType === 'INSURANCE' || docType === 'INSURANCE_POLICY') {
      const policyType = doc.policyType?.toUpperCase()
      const assetClass: CanonicalAsset['assetClass'] =
        policyType === 'LIFE'   ? 'INSURANCE_LIFE'   :
        policyType === 'HEALTH' ? 'INSURANCE_HEALTH' :
        'INSURANCE_OTHER'

      assets.push({
        userId,
        assetClass,
        primarySource:      'digilocker',
        secondarySources:   [],
        sourceRecordIds:    {
          digilocker: doc.uri ?? doc.docId ?? doc.id
        },

        institutionName:    doc.issuedBy ?? doc.issuer ?? doc.insurerName,
        institutionType:    'INSURANCE',

        policyNumber:       doc.policyNumber ?? doc.documentNumber,

        currentValuePaise:  Math.round(
          (doc.sumAssured ?? doc.coverAmount ?? 0) * 100
        ),
        investedValuePaise: Math.round(
          (doc.premiumPaid ?? 0) * 100
        ),
        gainLossPaise:      0,
        currency:           'INR',

        assetName:          doc.policyName ?? doc.name ?? doc.planName,
        assetSubtype:       doc.policyType ?? doc.planType,

        isActive:           doc.status !== 'LAPSED' && doc.status !== 'EXPIRED',
        isDormant:          false,
        hasNominee:         !!doc.nomineeName,
        nomineeName:        doc.nomineeName,

        openedDate:         doc.policyStartDate ?? doc.issueDate,
        maturityDate:       doc.policyEndDate ?? doc.expiryDate,

        digilockerUri:      doc.uri ?? doc.docUri,
        documentAvailable:  true,
        rawData:            doc,
      })
    }

    // LAND_RECORD documents → enrich existing LAND assets
    // We create a partial asset that the dedup tool will merge
    // with the Surepass LAND record if it exists
    else if (docType === 'LAND_RECORD' || docType === 'PROPERTY_CARD' ||
             docType === 'SALE_DEED') {
      assets.push({
        userId,
        assetClass:         'LAND',
        primarySource:      'digilocker',
        secondarySources:   [],
        sourceRecordIds:    {
          digilocker: doc.uri ?? doc.docId ?? doc.id
        },

        institutionName:    doc.issuedBy ?? doc.district ?? 'Land Registry',
        institutionType:    'LAND_REGISTRY',

        currentValuePaise:  Math.round(
          (doc.registrationValue ?? doc.stampDutyValue ?? 0) * 100
        ),
        investedValuePaise: 0,
        gainLossPaise:      0,
        currency:           'INR',

        assetName:          doc.surveyNumber ?? doc.plotNumber ??
                            doc.name ?? 'Land Document',
        assetSubtype:       doc.docType ?? 'land_record',

        isActive:           true,
        isDormant:          false,
        hasNominee:         false,
        titleStatus:        doc.titleStatus ?? 'documented',
        ownershipType:      doc.ownershipType ?? 'unknown',

        openedDate:         doc.registrationDate ?? doc.issueDate,
        valuationDate:      doc.issueDate,

        digilockerUri:      doc.uri ?? doc.docUri,
        documentAvailable:  true,
        rawData:            doc,
      })
    }

    // PROPERTY documents (flat, apartment, building)
    else if (docType === 'PROPERTY' || docType === 'FLAT_REGISTRATION') {
      assets.push({
        userId,
        assetClass:         'PROPERTY',
        primarySource:      'digilocker',
        secondarySources:   [],
        sourceRecordIds:    {
          digilocker: doc.uri ?? doc.docId ?? doc.id
        },

        institutionName:    doc.issuedBy ?? doc.registrationOffice ?? 'Sub-Registrar',
        institutionType:    'PROPERTY_REGISTRY',

        currentValuePaise:  Math.round(
          (doc.marketValue ?? doc.registrationValue ?? 0) * 100
        ),
        investedValuePaise: Math.round(
          (doc.purchaseValue ?? doc.stampDutyValue ?? 0) * 100
        ),
        gainLossPaise:      0,
        currency:           'INR',

        assetName:          doc.propertyDescription ?? doc.name ?? 'Property',
        assetSubtype:       doc.propertyType ?? 'property',

        isActive:           true,
        isDormant:          false,
        hasNominee:         false,
        ownershipType:      doc.ownershipType ?? 'unknown',

        openedDate:         doc.registrationDate ?? doc.purchaseDate,
        valuationDate:      new Date().toISOString().split('T')[0],

        digilockerUri:      doc.uri ?? doc.docUri,
        documentAvailable:  true,
        rawData:            doc,
      })
    }
  }

  return assets
}

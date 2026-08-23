--
-- PostgreSQL database dump
--

\restrict EBxeH5epSpveEZQ5wuMof8WRGHGX6xUF9zUEaH7pB9FfV6iCUmYVxhyJH0icZ7I

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

SET SESSION AUTHORIZATION DEFAULT;

ALTER TABLE public.users DISABLE TRIGGER ALL;

COPY public.users (id, aadhaar_hash, name_encrypted, dob_encrypted, mobile_encrypted, pan_encrypted, created_at, last_login_at, mobile_hash, email_hash, email_encrypted, fathers_name_encrypted, nationality, country_code, registered_at, fcm_token, subscription_tier) FROM stdin;
dddc9844-5d6f-4ce7-8765-687e8703c1ff	dev-mock-hash	8bb6001c717e51511dbd50c55ea36f0c:0cb297fc5b58baca9a248eb6c386d404:f0b923dc0f77b6a07cc685ca04af	b66f6c19193307648c7101f18ada2c7b:80ea1fc65168d8f7a11db9e0d125b98d:9031547bde480431378b	169b7565b65f166ac88d61220b96549a:34ecc9842df29a55364b6ee18153c3f2:4e5da0d7df6a289e6d3e89bd	\N	2026-08-23 20:09:37.194137+05:45	2026-08-23 20:16:33.817154+05:45	980c99b5d3cf3c397ce85d9bd9083afc2d3b4c6d22b4eeefe7f4517d93a63b4e	\N	\N	7a6af10051df96be6d81aae1fc6ca8ae:42f10aca04c9dfceb307ed5a395179d9:60802143e18fecfa2169	US	US	2026-08-23 20:09:37.194137+05:45	\N	premium
3e6a8df6-add6-4d20-8392-f452b8ceddc3	2a33349e7e606a8ad2e30e3c84521f9377450cf09083e162e0a9b1480ce0f972	226ea40af8efbd517f3b35cd5983e236:ea98e88d24495e52960f86146e08f045:be3e562c74b7	1097f68a4138462cad100a0dd007a622:fb5cf4fdfccff5c5090c5898b65fe948:4906fc7efff0b788536e	63afdf9415ced77289cf12e9543367e8:60eda9d6ef6387efc3b5f624e37e23cc:735a10254934408a70c8	\N	2026-08-23 20:06:17.389485+05:45	\N	ce3a598687c8d2e5aa6bedad20e059b4a78cca0adad7e563b07998d5cd226b8c	\N	\N	\N	Indian	+91	2026-08-23 20:06:17.389485+05:45	\N	premium
\.


ALTER TABLE public.users ENABLE TRIGGER ALL;

--
-- Data for Name: alert_preferences; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.alert_preferences DISABLE TRIGGER ALL;

COPY public.alert_preferences (user_id, sms_enabled, push_enabled, email_enabled, balance_drop_pct, balance_drop_min_paise, alert_balance_drop, alert_new_account, alert_land_change, alert_dormant, alert_nominee, alert_large_txn, large_txn_threshold_paise, updated_at) FROM stdin;
\.


ALTER TABLE public.alert_preferences ENABLE TRIGGER ALL;

--
-- Data for Name: ancestral_searches; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.ancestral_searches DISABLE TRIGGER ALL;

COPY public.ancestral_searches (id, user_id, ancestor_name, ancestor_name_variants, relationship, relationship_label, state, district, taluka, village, survey_number, approximate_decade, additional_clues, status, search_method, states_searched, variants_tried, api_calls_made, results_count, confirmed_count, initiated_at, completed_at, duration_ms, plan_at_search, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.ancestral_searches ENABLE TRIGGER ALL;

--
-- Data for Name: ancestral_offline_guides; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.ancestral_offline_guides DISABLE TRIGGER ALL;

COPY public.ancestral_offline_guides (id, search_id, user_id, state, district, tahsildar_office, office_address, office_phone, office_hours, forms_required, steps, portal_url, request_letter_s3_key, created_at) FROM stdin;
\.


ALTER TABLE public.ancestral_offline_guides ENABLE TRIGGER ALL;

--
-- Data for Name: canonical_assets; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.canonical_assets DISABLE TRIGGER ALL;

COPY public.canonical_assets (id, user_id, asset_class, institution_name, account_ref_enc, folio_number_enc, has_nominee, nominee_name_enc, current_value_paise, digilocker_uri, source, is_active, last_synced_at, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.canonical_assets ENABLE TRIGGER ALL;

--
-- Data for Name: ancestral_search_results; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.ancestral_search_results DISABLE TRIGGER ALL;

COPY public.ancestral_search_results (id, search_id, user_id, raw_owner_name, survey_number, khata_number, village, taluka, district, state, land_area_acres, land_area_sqft, land_type, land_use, current_owner_name, current_owner_type, mutation_history, last_mutation_date, last_mutation_type, has_encumbrance, encumbrance_details, is_disputed, confidence_score, confidence_label, confidence_reasons, name_match_score, location_match_score, time_period_score, matched_variant, match_type, user_status, user_notes, confirmed_at, portal_url, deep_link_url, canonical_asset_id, added_to_records, raw_api_response, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.ancestral_search_results ENABLE TRIGGER ALL;

--
-- Data for Name: asset_snapshots; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.asset_snapshots DISABLE TRIGGER ALL;

COPY public.asset_snapshots (id, user_id, snapshot_date, total_balance_paise, bank_balance_paise, mf_value_paise, equity_value_paise, nps_value_paise, insurance_value_paise, land_value_paise, total_accounts, bank_accounts, investment_accounts, created_at) FROM stdin;
9d7fe291-c1c3-43aa-830a-f2641b860d05	dddc9844-5d6f-4ce7-8765-687e8703c1ff	2026-08-23	2353825000	605000	850000	1250000	620000	500000	2350000000	6	2	4	2026-08-23 20:10:49.83307+05:45
276b4b2f-8dc0-44fe-b9fa-93b2253ec209	3e6a8df6-add6-4d20-8392-f452b8ceddc3	2026-08-23	2353825000	605000	850000	1250000	620000	500000	2350000000	6	2	4	2026-08-23 20:10:35.594366+05:45
\.


ALTER TABLE public.asset_snapshots ENABLE TRIGGER ALL;

--
-- Data for Name: consents; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.consents DISABLE TRIGGER ALL;

COPY public.consents (id, user_id, aa_handle, consent_id, fi_types, purpose, date_range_start, date_range_end, status, created_at, revoked_at) FROM stdin;
8b3cb606-39ad-403d-8c8d-ee1c0743c8b1	3e6a8df6-add6-4d20-8392-f452b8ceddc3	\N	7c35b763-3dfa-4465-bb79-bd7918486e88	{DEPOSIT,EQUITY,MUTUAL_FUND,INSURANCE_POLICIES,NPS,LAND_RECORDS}	Dummy Consent	2023-01-01	2030-12-31	ACTIVE	2026-08-23 20:06:17.400173+05:45	\N
900e064d-ddd1-41b5-9742-3803bc728241	dddc9844-5d6f-4ce7-8765-687e8703c1ff	\N	d89155f8-4ad4-4555-8a28-f997a4d06131	{DEPOSIT,EQUITY,MUTUAL_FUND,INSURANCE_POLICIES,NPS,GSTN,LAND_RECORDS}	Comprehensive asset discovery and visualisation for personal financial planning	2025-08-23	2026-08-23	ACTIVE	2026-08-23 20:10:42.09766+05:45	\N
\.


ALTER TABLE public.consents ENABLE TRIGGER ALL;

--
-- Data for Name: asset_snapshots_aa; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.asset_snapshots_aa DISABLE TRIGGER ALL;

COPY public.asset_snapshots_aa (id, user_id, consent_id, fetched_at, fi_type, institution_name, account_ref_encrypted, balance_encrypted, raw_json_encrypted, currency) FROM stdin;
b0cf0f03-aa41-4911-93aa-374cfc4b0caf	3e6a8df6-add6-4d20-8392-f452b8ceddc3	8b3cb606-39ad-403d-8c8d-ee1c0743c8b1	2026-08-23 20:06:17.417186+05:45	DEPOSIT	HDFC Bank	e41880977a3e9159ace997c9d73fcf45:0b8d0e1c1dc6b7ce1d2457c783f7c289:ad19eb294c1f1ee0	de7a5659e49f8ce6cc09b0ee21978d88:5b75f97cc95e760990e3aa6bb5e3e6f9:b062243b99b2c3f8	81b4db4a1302d409854a225c7d9b6615:1e6ec8c0f0005dbeb4abec5d0ac62d41:884a30a550d9c83530affe06ec44ecf38adc754febfa29d29f0b4ee0ac71143a3376fc69	INR
00ec2532-8589-470f-aa00-321ea64c188b	3e6a8df6-add6-4d20-8392-f452b8ceddc3	8b3cb606-39ad-403d-8c8d-ee1c0743c8b1	2026-08-23 20:06:17.424216+05:45	DEPOSIT	State Bank of India	4aac06e3b04ddf9dd763ea3b1003226c:57ffa87f7821de126076304db3a47c6a:b9df04dd2b9b6097	04c2df8948bfebbff981346af3d6ea0a:6ff37325f7e3dc3dcd0ce9dd02e78aad:2ef45dc94eef	97a7c20b0c79d08f55c7ac89dbf0f79f:b5ee3a29e38734b06f157546a9ad304c:f77e4767314cf6da5c29d00541db78f3145324829ca37c5fa47faba16d349d40fd485513	INR
374b637a-b4a0-451c-9cb4-3926d5e99128	3e6a8df6-add6-4d20-8392-f452b8ceddc3	8b3cb606-39ad-403d-8c8d-ee1c0743c8b1	2026-08-23 20:06:17.429997+05:45	EQUITY	Zerodha Broking	550ee95e98e954d412b0cec2c9b16aae:1502f744aa753fa5c1ca01f72f285ade:dec1eb464f06a23fefdf0ed4b6	dc9ec66619bf5c8791ff2a941d7b3ba1:3fe6a87974e3d08b4765ea1045263a3c:480ebce5642131	51b3ca80e25aa71271cf34378cecffac:2abf64b97de9e4bfd5511311d78590db:af5050b688c52ba37062b521152bc9353470925aea35289c6ce8d6ca3d09	INR
39925f0d-75e7-40ce-9e59-39805b659098	3e6a8df6-add6-4d20-8392-f452b8ceddc3	8b3cb606-39ad-403d-8c8d-ee1c0743c8b1	2026-08-23 20:06:17.432377+05:45	MUTUAL_FUND	Groww	b84fbe4b3b3b44fb08364da23cde7e3c:32c554e184cc680125830c8a813de7b1:aa2cfa13b47971120bd21a02680c	f163e9df94bfef3bcc64829485113f0e:0c84edc8124c4bbc3ba88d9943a6d753:93b8abab1925	24b99adf81f708c887f9f3da74802cfe:623286b6039a8e86023fae032f98b360:829913b86bbd6d07f784c0ae9ba5c4dac2df23c38604210feabc0a2135ec3a97c6	INR
8bec2f45-700f-49ae-89b0-9e9c2cbd5f93	3e6a8df6-add6-4d20-8392-f452b8ceddc3	8b3cb606-39ad-403d-8c8d-ee1c0743c8b1	2026-08-23 20:06:17.434519+05:45	INSURANCE_POLICIES	LIC of India	5fcb6aeacc3e88af5b43473d49586760:d0b3fb7157a5f863129aab8ee2ed418f:2664cd0ebcc650f49029b421	6b8e9b6efeb02bfe7a40b5d1d024239e:1a2528e4d72c464b872b61be40c35089:cb507a22401c	d26a607d39d67883cd8dbc3db12f7672:a623964c17ead9035aca81a718075557:b31ceb399220359bf7657bbd7e69a958e4771419c738cb62bd6acbe36970df0e45	INR
002d0534-1a57-44c3-9848-fc23f156f117	3e6a8df6-add6-4d20-8392-f452b8ceddc3	8b3cb606-39ad-403d-8c8d-ee1c0743c8b1	2026-08-23 20:06:17.437138+05:45	NPS	NSDL CRA	daadc8514508078ddb419c1917439b38:8d4cbb6bfe616d3ffa9957e434374947:5762eee2cecd596b6011f60d02	0dc5619b736698d48a08fd979ca9f845:4a694be7ff83766b6f34cd37dd2b9762:af5d63f6cf24	718318626d02c000c0996f30954933a8:c08ff9b8d7656e89a30cc0d092b99017:82ddba6f33ec273f9625092ff6d714a447efb27bd549584dffddfddedfd54e7f4adc28	INR
2c18e6c5-7a2b-42b9-98c9-650fd23ed4da	dddc9844-5d6f-4ce7-8765-687e8703c1ff	900e064d-ddd1-41b5-9742-3803bc728241	2026-08-23 20:10:42.125645+05:45	DEPOSIT	HDFC Bank	084fb684be2ece74c6397f0bb69020da:84e5d930af64265ab0ee0a8777a09fba:724cea3a6bb02ff2	7b52e17b6c665e919924cdea074cf192:63b5b670dde2ab556ff947d755a45195:c5a57d33336eeab0	615fb84bf41a6853213e06be10c541de:1ebf94a00b711f8e39fe24d906242f2a:9c76bd378b6c92a23009bfca1c190ee117bebb538ee25c9f638a98cd496413229be199be	INR
2b2598b6-9740-473f-a7a1-950b77db23da	dddc9844-5d6f-4ce7-8765-687e8703c1ff	900e064d-ddd1-41b5-9742-3803bc728241	2026-08-23 20:10:42.131687+05:45	DEPOSIT	State Bank of India	47072cf6b23966f2304491be8f2b38af:8d23a2dc3211edef2c091b47d95dd455:17607d5c78ecb97e	851936be44e8cf7f5735e1b8eab8e649:b450f04883760820e91220a7a69e3076:b9cc3e9a253d	15d6632c5c059969ff3f0a961df713b9:836a33459c47e71674c77523b470218a:d3623382eaae36a466d601bb3a6200911df24ec4d24ad69d5399c9791184285d6bb1278c	INR
d32fba4d-0266-4e06-8ac5-9e0c0794d3ab	dddc9844-5d6f-4ce7-8765-687e8703c1ff	900e064d-ddd1-41b5-9742-3803bc728241	2026-08-23 20:10:42.136707+05:45	EQUITY	Zerodha Broking	cde03cc957bf9f6dc255ca3d66f9c5cd:c8fc69b1f3d4a3297da76e826e62bdf1:562396135bbbda2a6f03460b3a	6269b3fe17a391fd830a88aded41e111:1e5946f3f7fcd122d0238b2373b93a9a:36f31e2c65712c	3020291bae0bf6009afe4bba8dd2c26d:89469330633db52e438eb05a251d73b9:91c58217af45d71e94a5bd311e4ebbb4389142c7941fe5cfc79c7b87eb47	INR
88867c61-3c0c-4d83-956f-c24b8d7b897a	dddc9844-5d6f-4ce7-8765-687e8703c1ff	900e064d-ddd1-41b5-9742-3803bc728241	2026-08-23 20:10:42.138408+05:45	MUTUAL_FUND	Groww	cb30f41cb59b071f6a23b6097de2cacd:f4ed1f6ae6229519cef3dcf1c4bdc1b4:67547269421ffdddb2dab134c287	1ac8720c6c6b58558b6f0b6eb9c378ed:d9bbdf4d3eb5952289063c2cf4b09688:96cae31fd0ef	37dab0c53cfca49ec476dbec5a985972:9aeb060e9ea7f126414683acecc378e7:9efdbe4105c2e4b96d6eea1b3dae2131f282d8352652fda003069841723024a9ad	INR
40d5c36c-4f88-46d8-82ad-13e49a4757c0	dddc9844-5d6f-4ce7-8765-687e8703c1ff	900e064d-ddd1-41b5-9742-3803bc728241	2026-08-23 20:10:42.140627+05:45	INSURANCE_POLICIES	LIC of India	6454fa986d80a9ab68dcf2a3727c4cab:e05d5564f847592a41a6e24c336659bd:7fadd9fd87b4b89c8439261d	e766ea65b045ca1d012f712b8ebae621:3dba637bb699f57decd7690cdefe8e58:7cc803e20fc0	0f764ecb78cae9bc2380ff66a80bac9d:bdf4ab635a07725af7350ba30770ec2e:593d0d94b03c4689e0c44597b29ba13b31dc6baac44408811b672e9817ca437081	INR
e9511c49-6104-44b8-8a00-467d1cf324a1	dddc9844-5d6f-4ce7-8765-687e8703c1ff	900e064d-ddd1-41b5-9742-3803bc728241	2026-08-23 20:10:42.142848+05:45	NPS	NSDL CRA	25918add7a0789b52a817cf92c92fa71:bad848da2fe67b2986c89df3523edcbb:d4fa1785c6a9d8f43385d67dca	220a65c8e5653f47aefc8600a9611148:3881d39d460386bd7039aab407e5dcfc:303c86c8e1c7	7b8060852856957c47875e3f9ee665ee:ecc4fc993f6143d71bdec22b2b13b603:bd62715c1620ec267fd1000377681e9c3f7e6ae5893020b76b934ae1128197b3bb9eb4	INR
\.


ALTER TABLE public.asset_snapshots_aa ENABLE TRIGGER ALL;

--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.audit_logs DISABLE TRIGGER ALL;

COPY public.audit_logs (id, user_id, action, entity_type, entity_id, ip_address, user_agent, metadata, "timestamp") FROM stdin;
93d030b7-2ce3-4ee4-9637-a72ad45b5153	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-07 20:43:24.604363+05:45
35074061-cd32-4ce8-8dc0-7b0da9ca6dcc	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-07 20:43:24.61727+05:45
5497dbf1-85fb-428a-920c-608cc0c4b41a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-07 20:46:17.316025+05:45
100bc251-6cde-4d44-9c77-a916f2d9f739	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-07 20:47:05.489393+05:45
e1840171-ca5a-4581-8d3b-a6812c0d75d0	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-07 20:47:05.500529+05:45
47232db0-6c7d-4bbd-95c9-4d98222c2966	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-07 20:48:35.997487+05:45
7b9d9a7d-db95-4b55-b434-d401456943c4	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-07 20:48:36.012903+05:45
5b344393-07ca-429d-8792-aacd4405b151	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-07 20:49:40.212618+05:45
12cbe7bc-cd49-46bc-a7bf-be6671e6b878	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-07 20:49:40.223095+05:45
ea077e43-d661-4bea-8048-d852c89620a0	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-07 20:49:41.844494+05:45
1f4a6f30-1feb-4406-a207-8941ccd21459	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-07 20:49:41.857318+05:45
0a1e4126-9017-4169-9f1b-aea4276f4007	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-07 20:49:42.661402+05:45
3ee4a5af-68f6-48ad-8834-1bf8853e4280	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-07 20:49:42.671645+05:45
cfaa3dae-7a99-4300-a45a-c8f3c484a12c	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-07 20:49:42.80463+05:45
6ab389ca-c739-497c-9b42-1abe6d8641ec	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-07 20:49:42.815963+05:45
a9f4a74f-b0d3-416a-b03f-8dd7fe0d366f	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-07 20:49:43.030893+05:45
3abf73ab-a901-4293-9ce5-7aa530d9c516	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-07 20:49:43.039671+05:45
cb503838-0ab7-4927-86c8-7e17835f5983	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-07 20:49:43.200287+05:45
b8f1a9af-0cc9-4951-8d0a-c7953a9d606f	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-07 20:49:43.209157+05:45
d82b1c49-362c-4099-92c2-323a317efb7c	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-07 20:49:43.394255+05:45
64d32316-51b9-43ab-9f3a-16c20d4bfaaa	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-07 20:49:43.403964+05:45
3956be95-7ea1-4580-9ee2-5643a29741ac	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-07 20:49:43.559141+05:45
f21d649b-0a66-4093-b8fe-ad88c994e5ba	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-07 20:49:43.57384+05:45
e21e04e3-25d0-4c14-90eb-53866a3aab31	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-07 20:57:41.910543+05:45
38ebe89b-d865-493a-a1ec-454e4fd5b26e	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-07 20:57:41.921538+05:45
db502c46-9b04-46c0-b66c-3ed69d8f3818	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-07 21:00:42.115762+05:45
af401c5a-9697-4853-860e-53810ce2547e	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-07 21:00:42.125975+05:45
5f4c624c-6ee5-44c1-9d58-faa1d9525958	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-07 21:02:17.305339+05:45
6a0f382f-ee11-4be4-a131-afa68d30e0d0	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-07 22:30:14.34273+05:45
b2d520f9-df13-45d0-97df-fbc4c1bf9da8	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-07 22:30:14.567703+05:45
0db464e0-9b4c-4f2c-a4ae-2aa29035765c	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-07 22:30:16.840848+05:45
0a454bb5-2e5a-45dc-87f6-1a2b3186b697	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-07 22:30:16.862176+05:45
f9a0c476-fe22-42e4-a564-96d58bdeef86	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-07 22:30:18.079874+05:45
bc1df996-1a90-4794-a38d-36f3d86fc108	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-07 22:30:18.097805+05:45
1804df6c-d996-4601-baf9-dfdcac78ac0d	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-07 22:30:38.201425+05:45
10dc9499-1143-4797-99ef-f3eac40e1cd0	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-07 22:32:19.790327+05:45
daa679c1-6f2f-4698-95be-822571c14407	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-07 22:32:19.811861+05:45
0e64323f-c5b0-47d3-98a3-a683df655f63	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_CREATED	consents	96155f45-4c9c-4b52-820c-830b53d6286a	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-07 22:32:26.545393+05:45
d72af8e1-18cd-4b41-9651-aee941617b75	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-07 22:32:28.71513+05:45
85e93c71-9e20-4eb0-8eac-fe27b88fa93a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-07 22:32:28.735707+05:45
8151d497-1b5a-4deb-92b0-7d737008e950	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-07 22:34:59.370659+05:45
65cd00df-ff85-4b6f-b3f0-e6d09637e1ec	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-07 22:36:04.325756+05:45
cdbcce90-b5a1-44a3-947e-6aaa9ecac8e9	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_CREATED	consents	bac6e591-f118-4c63-965d-5d112a79571d	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-07 22:36:28.063243+05:45
793fc1cb-a302-49fe-8c92-63cdaa424dc6	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-07 22:36:30.190614+05:45
80b1004c-cf25-4a54-bea3-fc6712bbb385	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-07 22:36:30.220028+05:45
88f85a03-8314-4339-96b2-21807d390fd5	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-07 22:43:08.887616+05:45
0041c8e0-ea9f-47f2-98a7-2c29f8333419	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-07 22:43:08.911935+05:45
5864ef66-9c59-4b03-b997-40c190386a3c	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-07 22:54:48.309749+05:45
0c876824-f684-4708-ade4-e7a1b18dac4e	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-07 22:54:48.50415+05:45
1c9c50b3-4e3a-4aaa-9294-029a5f0906b4	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 10:59:46.712922+05:45
1525afef-859a-4663-b9d2-a4caf95fa2b1	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 10:59:46.895411+05:45
8c1b3dde-9307-4e96-9748-a10b84a006c0	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 10:59:46.906707+05:45
cd237f0f-4c66-4246-960a-3ca1d322ae8e	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:28:01.110206+05:45
bf107325-de8d-4d45-bcf6-7ed48a514b79	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:28:01.259141+05:45
06fa78c8-5cc2-4214-bfb6-3a30bdef09d7	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:39:18.483923+05:45
07e8888e-8e4b-4ed1-ba38-685cf341d280	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:39:18.497809+05:45
0cdbf2c9-5f72-4a2b-b187-b12a04e4541d	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:41:30.074813+05:45
b57133ed-e0aa-4cf6-ad3c-8f28ee7d87d3	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:41:30.118979+05:45
54093a24-6ca5-429a-b3ba-c2397c061113	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:41:31.061082+05:45
72849501-919e-4bca-8dd2-e588f0531866	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:41:35.704644+05:45
82c23c12-fda6-409b-b7e3-3f864eb5f520	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:41:35.718355+05:45
add72f50-adfc-4d7e-999f-eb6326fd2299	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:41:37.423169+05:45
4cee99bd-2997-44a7-86ba-d57a37a703bc	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:41:37.433343+05:45
ddaed843-3493-45ae-99eb-a049044967fe	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:42:34.615183+05:45
8fcdfc8f-78ba-42f9-b933-cd6e9dcacd1a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:42:34.631506+05:45
48c4a2e6-ccea-4653-83a9-b952b0ca0173	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:42:34.853572+05:45
da704634-be5b-4949-aec4-78daf26f7f82	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:42:34.869454+05:45
9312beb0-14f7-406c-91ca-6e3df3414cde	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:42:35.644192+05:45
770d17d7-ec42-4306-b8d4-4433eb586757	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:42:35.659509+05:45
5978f36c-a02e-4dc2-a0e7-b5305055a22a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:42:35.924291+05:45
112fc9dd-3074-4f13-85a2-a8db121268ba	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:42:35.939723+05:45
68552117-c95a-47aa-bbaf-c432761b93e1	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:42:36.086137+05:45
46908e39-98f8-4f60-9ade-745d317e58f4	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:42:36.099115+05:45
6a6f4a6e-77b7-4bf6-a0ca-181fa947afa6	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:42:36.309236+05:45
876d6725-3f1d-4ebe-8923-eef17b4c5c53	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:42:36.323441+05:45
d3e1d1eb-a44e-4571-a7d5-7a28816f8c38	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:42:36.505259+05:45
706245de-ace2-42f3-a411-7a57e3cf3885	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:42:36.514266+05:45
86e96a48-8c3e-4192-a4f4-a60a4de62f12	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:45:00.314035+05:45
0f9d772a-8076-4f05-9bf5-f96ef7b9387a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:45:00.435663+05:45
a0d38f32-1d27-46af-b949-66ebb07a6e5e	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:45:00.447122+05:45
08af79a3-bfff-4865-86b4-2b1618e0e75d	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:45:02.374619+05:45
f7f7c2c9-b72c-4704-9a14-83e62613e521	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:45:02.384481+05:45
69a7b473-9a7c-4e81-a9d2-0ae18e4fdad5	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:45:03.29651+05:45
0c6e5fbd-5f63-4e65-906e-b656de39ae57	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:45:03.309026+05:45
da0ac3a4-80bf-4dca-a00a-e1f275563ed4	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:46:06.812724+05:45
967bc504-8867-4890-995a-f39c2c9f2b5f	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:46:06.825172+05:45
4eea3b4f-9081-40de-989e-1203ae765e62	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:47:35.106696+05:45
d01b3bd2-b551-43e7-ac13-a36ae75b0d80	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:48:23.226692+05:45
1cf5fa38-fd08-4ad5-b3f6-0e28dd0c751c	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:48:23.252003+05:45
33a4845c-236c-4db4-81ba-8f673d56baf9	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:48:24.319427+05:45
5428e0c4-c4a0-4648-a4fa-1a465c9fc7fb	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:48:24.328302+05:45
2c8df67e-99c5-4f42-afb9-aa625dd32c1d	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:48:25.443562+05:45
629d0107-777f-4e91-823a-d29cc30144e3	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:48:25.455376+05:45
b0fd3ed3-ece8-4a22-aea2-bf2739947528	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:50:43.374535+05:45
6ed11443-ff53-40eb-9da6-b05dd0dd2696	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:50:43.392285+05:45
c2fde135-b3ab-4444-9314-8a3a407b63e8	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:50:44.409925+05:45
b4fc5f71-5b38-40e9-9818-2d3a32a25a33	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:50:44.422473+05:45
67567062-3036-4e32-ab1d-218168c1862f	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:51:23.589932+05:45
aa9380b3-79fb-4fb5-b406-82a8db3ab7c8	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:51:23.632027+05:45
d7ca2126-b89f-4813-90b8-d09304f7bbb3	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:53:19.557002+05:45
84a1236c-3dc8-44c5-94c7-0c0b60621b3c	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:53:19.593739+05:45
6e5ad73c-6deb-48c0-8cab-baf94767b22e	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:53:27.847428+05:45
eb10b960-d074-46f8-9c1c-999a706f4cfd	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:53:27.863332+05:45
c840f8e3-bfd1-4148-bbbd-75048e983f04	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:53:28.828681+05:45
89e8e89d-f1b2-4b72-b7ce-56423e13bc86	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:53:28.843232+05:45
8751e319-3137-4fcf-84bc-c2bd1744cef6	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:56:01.781114+05:45
6b10647c-f92b-47df-947f-fbfa75ba35ac	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:56:01.798532+05:45
fa149ec7-35f7-4cdd-9a87-bc4aa7b7a1aa	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 11:59:28.101518+05:45
8908e04c-a8ad-40e6-b347-4e3ef8b02427	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 12:01:24.57291+05:45
dacf3d3b-e064-4b6e-89eb-4fd257863508	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 12:01:24.710609+05:45
32de59b5-1451-4bfa-95cf-8be7bc4ebf9d	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 12:01:24.734021+05:45
4eac8e14-0e8d-4244-bb8b-2aa8c6f2b026	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 12:04:06.956213+05:45
9acf404d-6efa-474d-b617-2daa7c94cd68	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 12:04:06.97816+05:45
0d3c9a8b-90d9-449f-ae19-89820c88261c	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 12:05:28.266117+05:45
79e5ee16-25fb-451e-b0b2-edf7e690c729	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 12:05:52.239644+05:45
41747bc8-258e-484d-8085-4c46c2b586c4	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 12:06:18.042068+05:45
eb266047-e57b-42d8-a064-d305f7500968	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 13:28:24.879297+05:45
c9d70edf-a6a1-4d85-9fa6-a295a53f313e	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 13:28:25.271312+05:45
58f27859-5aaa-4f52-a5a0-160dd7951dc2	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-08 13:28:25.285367+05:45
954271d1-2258-4aec-8997-bf15fc9452d6	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-09 11:29:23.976831+05:45
c7d3674a-2f1d-4891-8610-41efb2d1c62b	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-09 11:29:24.167028+05:45
5afe72eb-5d10-446c-bc6c-fb1eb0793b3d	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-09 11:29:24.180812+05:45
396366e5-856b-492f-8f41-a3d92d34dfe7	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-09 11:50:48.261578+05:45
171ee4a2-b18f-49e1-b59f-95499a35cc30	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-09 11:50:48.315519+05:45
7f5594cd-4c3f-4953-9a8b-cb019d2bf618	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-09 12:22:11.048649+05:45
8cdb6c5f-d346-4777-9cc3-802869bb1096	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-09 12:22:11.061948+05:45
6c1967b1-528c-4bd6-93af-d66815479d21	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 12:26:54.261583+05:45
79bdee7d-a1be-49bd-a785-65d856602653	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 12:26:54.323493+05:45
fa08643e-84dc-49c3-9916-1599d004811d	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 12:27:56.968269+05:45
7c9c739d-d057-4bda-95f8-d64897838d94	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 12:32:35.454846+05:45
6693e5b4-9128-4388-8fd0-b156b38ea123	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 12:32:35.478413+05:45
c65f68b2-0b23-40a3-b9d6-dbd4164c6bb7	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 12:33:10.156037+05:45
6f971dfb-1379-4831-8397-2fb2403d854e	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 12:39:33.70485+05:45
a4eb1e10-5b23-4b94-a0a6-201538d1779d	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 12:39:33.718544+05:45
3e619749-5622-44c3-b9f3-5ec36e5bb5a1	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 12:49:36.078634+05:45
6f7d7374-df32-41f4-afd2-ffee7dbd430d	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 12:49:46.848024+05:45
10acf487-86e4-48a6-80a5-298f7e2dc8cd	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 12:49:46.863045+05:45
bcbd5694-5da9-4bae-b4b8-72c410c0fe57	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 12:57:13.213287+05:45
ba84404a-7836-4942-ba33-278db4cd2bd2	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 12:57:38.958273+05:45
d10565a7-1bc1-438b-a05a-313d8a15ea8f	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 13:02:34.013679+05:45
9f8b84c9-c121-4d09-b0ac-1b2a7c2d9c21	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_CREATED	consents	09426eb2-9a2b-4bb2-9828-e17abc024c6e	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 13:05:27.697694+05:45
bfc6d9eb-b5c9-422d-b547-97710b7ec815	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 13:05:29.862307+05:45
9d0e68b0-2d80-4d4c-bf38-af1e5ff233c2	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 13:05:29.873372+05:45
a8fdd4f0-a33b-44eb-a0ac-ad59ecef7c5d	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 13:06:33.9572+05:45
1b636d3a-6b17-4c00-b938-f7d76f8f3a19	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 13:07:53.856025+05:45
312fe2df-589f-4919-b6f3-8572c8ae018e	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 13:07:53.870423+05:45
509dc599-bd84-4d52-8ef4-03850c9ca37f	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 13:08:58.333462+05:45
cf5d96cb-3335-42d1-aa52-f2e53f065269	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 13:09:19.749108+05:45
0d64d32e-2a9b-4695-9130-7216fd4056a9	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 13:09:19.758795+05:45
31802833-9aa5-4bd8-927f-155445d0b926	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 13:09:48.903254+05:45
d509968d-8af3-496b-a568-adf30775581a	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	7d696d06-1922-4477-b51e-5bad1061c377	\N	\N	\N	2026-07-14 13:02:37.2132+05:45
571e9c36-3368-4f71-9df6-bd500e866a52	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 13:10:28.883018+05:45
51ae4762-3d13-4868-83e7-8c83af9b822d	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 13:10:59.24126+05:45
26663fdc-a316-4052-ae27-5f5fa0cfc64f	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 13:12:20.947988+05:45
0cddd4da-205e-4c4a-ab7f-0609b4a1570a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 13:12:21.02816+05:45
32d53e87-6f0d-4831-882b-973f3a195c32	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 13:12:41.393476+05:45
2a02a042-6355-4cc5-970d-95c5ccd3eeb1	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 13:13:48.463101+05:45
90213dad-8346-4820-b794-493ab287fc47	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 13:14:03.265598+05:45
7b72e4c7-343f-4737-8f75-512394a0fef9	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 13:14:25.176323+05:45
5d5cdff2-a2d9-4c77-b26d-9e69299640e7	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 13:14:25.201867+05:45
8088b75d-1018-4ea9-867d-d2298ecca361	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 13:15:44.119571+05:45
24db815a-c6d9-468c-9069-470d77c33eb5	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 13:16:30.257144+05:45
931757d8-f108-4798-ae96-77ca4428b21d	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 13:16:45.957664+05:45
38173090-34af-4779-b229-465fd476bef9	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 13:17:32.151609+05:45
47cfa020-49e2-445c-8812-e275ab3f7b71	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 13:17:43.953+05:45
67fd52a2-4bb7-418c-b121-30a3c7d29036	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 13:19:45.004966+05:45
b84f3b46-5703-4610-9288-fea8f43d4414	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 13:21:24.10643+05:45
b4afdacb-f27e-48cb-9ac5-df0cb7fcfb83	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 13:26:16.985385+05:45
f383fa10-8aeb-48a0-9d37-8ea310b57071	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 13:26:30.910219+05:45
5f966d3b-165f-4bb0-a799-1d72ca98b91d	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 13:26:30.923035+05:45
b52c5710-4f65-46d4-a2bb-25e3cd6adce2	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 13:26:38.909089+05:45
1e22a268-f922-4ad3-87d2-eb3adf2bc9ae	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 13:27:19.959725+05:45
9e163a3c-b6ad-4ab0-853d-ac073071d396	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 13:28:19.933966+05:45
b4134e28-bda3-42f0-838f-ce61d1ddcc5a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 13:28:20.019413+05:45
4a94ccf2-40f4-431a-92d0-984f2ef47440	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 13:30:43.964811+05:45
6405d96e-6f4b-4c57-a06c-25a8310725ec	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 13:30:44.057071+05:45
a2f2d9c5-79c8-4e7b-a0ef-4ab8f12cf12f	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 13:34:55.693855+05:45
69634a86-d8a2-4da9-b4ca-ada4d417ee0e	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 13:34:55.776574+05:45
ae0f937d-b6a7-4f16-aaf0-70dc68466573	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 13:34:59.761024+05:45
8d0e069d-42e7-4d43-9a81-37ab378d92dc	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 13:34:59.790632+05:45
3326df07-a19f-43bb-ae7e-9b26253e4fd4	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 13:36:17.952407+05:45
599c43ec-6d8c-4c46-b118-5b6b93f2560a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 13:38:14.989149+05:45
802e2963-b528-45ef-83d9-f526fa43460d	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:06:40.241756+05:45
91b6f912-abbc-46cb-863c-381afbee1bfc	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:06:40.476357+05:45
757f976d-1f4c-4736-a70d-47548534fad7	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:08:08.150642+05:45
17d3cf86-979c-4b8d-81a1-cbc384985933	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:11:38.808435+05:45
7e3c2eac-2530-487e-b7ec-736def1dc7e7	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	1e16849d-faaa-4ad0-8163-6df293edd942	\N	\N	\N	2026-07-14 13:02:37.216375+05:45
8ab1198f-b828-4964-b8f7-ca23c80f0518	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:15:12.181208+05:45
51c6a1e0-b525-4429-aaf3-880fa9bd504c	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:15:31.563502+05:45
e86a906d-2f38-4d57-aee4-78d67d373854	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:15:52.776563+05:45
5b124e92-09dd-4628-9a1f-bc0b0aaff88b	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:16:12.469756+05:45
1322daf3-361a-4e74-9f58-86afe5c415ae	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:16:12.514566+05:45
895464a9-1f7a-4b96-b22c-c88dbbde992e	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:16:50.225017+05:45
6f484ac4-6230-428d-8064-feaec0e58d67	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:16:50.252206+05:45
049ed7ef-7d76-422d-b83c-576d756d79c5	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:19:57.136735+05:45
2a68456f-9722-4c07-ae68-ba65f59e1f4a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:20:34.779911+05:45
2ba91249-82e6-4633-b594-71f5ca9c0029	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:23:50.1304+05:45
ce29e629-694f-471b-88e3-1c0c7f783564	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:23:50.3126+05:45
1f3d5307-8572-4739-b880-42402d2526c9	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:24:06.19167+05:45
79220d85-2070-49af-8139-ab0852b40dfc	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:24:09.533455+05:45
24678fb4-3016-44a0-a61a-e715c05bdf9c	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:24:09.567792+05:45
3ae3844f-570d-4584-bcf3-98349830f97b	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:24:27.998734+05:45
bd70ab3b-446e-42af-ac4d-455a25380240	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:25:17.6861+05:45
edcdb465-f209-4cf0-b5a6-b966d8d4318d	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:26:01.838505+05:45
303a84f1-e842-4e15-9db7-1e118951a96f	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:27:41.556437+05:45
c870fb24-bd91-430a-a889-d3d1f5589fd4	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:28:08.020381+05:45
3c152797-ff49-4dfb-a5f5-40f6c4dd5251	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:28:37.098854+05:45
f046b664-72b6-480c-9336-b87e84000be5	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:29:09.166243+05:45
a56eafe1-616b-4a6d-81ae-67fa9868704b	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:29:13.748441+05:45
fe926674-a8c4-4a38-97f0-cc3731749711	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:29:13.857195+05:45
9b13740e-ccc4-43a9-8e41-70bc037fd72d	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:30:41.209679+05:45
0faac9a7-e9e3-4b5a-b072-9ca31cc3156e	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:31:10.005868+05:45
2a71aa27-f7af-4dfc-b76b-852161fe2236	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:31:14.043256+05:45
252b6752-f1b6-4a8e-9212-c3407048a999	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:31:45.863082+05:45
7c25df37-bf8a-494d-a4a5-0629d867fc77	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:33:43.146642+05:45
754f084e-0c4c-4e28-8062-6e2228703a94	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:34:17.516415+05:45
fc50416b-d60a-407b-ae43-a03231b05085	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:34:17.547505+05:45
24a3452e-604e-4295-ab8a-3897813c777a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:36:15.39865+05:45
5498e4cf-9149-4c48-b60c-9c664e2199a6	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:36:15.493434+05:45
088264f3-e1cd-49fe-9785-5d73ed71f643	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:38:27.407329+05:45
a0bc47c2-eabf-4037-b7a7-dde0b782616c	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:38:27.483591+05:45
1ed8cbc1-a412-4505-85a9-9efba7a24b84	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:42:26.524623+05:45
c9921a57-25a0-4c07-ae13-706ac21baf29	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	1e16849d-faaa-4ad0-8163-6df293edd942	\N	\N	\N	2026-07-14 13:02:37.23456+05:45
344fc185-ccb3-4e02-bc3a-506ae8a5868c	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:42:26.740596+05:45
8abd0ffe-e513-41c2-9243-1e440fc2ee5c	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:42:26.761173+05:45
eab7080f-9b10-4f7a-a3cd-036fad01b1ba	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:42:49.703826+05:45
4b91cf68-dd90-4271-9379-50fa11f89e98	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:42:49.738085+05:45
6936445d-eb88-42b8-a161-f4582122ba6d	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:42:45.279583+05:45
c9e12b97-bbc9-4bc2-a4f1-0465f41073fa	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:42:45.313951+05:45
ebacdfd7-0731-4255-8001-300bc1e29bae	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:44:32.238058+05:45
7059d9ae-c9cb-48f1-b61c-3f66c1e0d2a4	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:44:58.730546+05:45
e83215ee-65e6-4e0f-b282-09f7aaec693f	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:44:58.769605+05:45
f64b40e1-c956-487c-97a0-b99e1bab1bb2	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:46:01.331976+05:45
db9791ee-3600-4e4e-82c9-800e8f70aa79	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:46:01.38069+05:45
a82ae8e3-f8d4-4192-b1eb-2f63367e0d77	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:48:54.919377+05:45
d173f886-dce0-469b-843e-ff403b25f85f	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:48:54.948018+05:45
d5e0f872-471c-4bc5-936a-cbe75b74588e	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:48:59.521859+05:45
57150937-26a8-45b7-8079-6154bd581eba	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:48:59.611803+05:45
bc9bec6f-a4f6-4135-bf9a-02b2d6a27d62	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:49:24.20198+05:45
7e74a565-a2b0-4afd-922f-80c5cb83c419	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:49:24.252844+05:45
abc6f6f1-cdd7-4638-baaf-8fdb4f483847	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:53:42.26427+05:45
3a10d773-b38e-4da1-a17f-5e813677d23a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 15:53:42.353868+05:45
4e1751b4-b425-41be-8f3a-4598845a5fd1	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:04:47.432493+05:45
fe6818af-78a4-476a-86a7-6486561ac16f	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:05:26.877787+05:45
e379e96e-1576-4dbf-b4b9-0dc2c4dbfc53	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:05:26.951539+05:45
4924c86d-13da-4cdd-814e-d746ae164845	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:07:14.917121+05:45
ce891491-dcc5-426c-a00f-7f0535393553	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:07:14.995188+05:45
ed939711-0cb3-4989-abd6-062b4b7533d2	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:08:08.195196+05:45
3547aa27-2c8f-48b9-b8a2-1195acfa8c08	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:08:08.259667+05:45
7b28c3fb-2be6-40f8-836e-e029486b717d	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:08:13.082091+05:45
393680a2-4fb3-49c5-adb7-a93737739024	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:08:13.119981+05:45
89a48721-5fa4-4d36-8ab8-3b55cdf81d53	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:08:13.88722+05:45
7a4f3239-b635-4f5b-b6b8-b4c09a6ad6d5	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:08:13.948626+05:45
69f6338d-0d9b-4575-ad16-6bf21612a467	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:08:39.637601+05:45
95661ae0-84c8-4621-9471-fb8da9d8960c	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:08:39.739871+05:45
77348707-18b1-4735-be73-9f175eab28fe	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:09:43.218243+05:45
5c04d471-cd0a-48b9-8b71-3e5fc6b7f675	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:09:43.2566+05:45
228f6bce-712f-4b33-99c4-9c1efd42826c	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:09:55.376248+05:45
45862594-448e-4e3b-bece-235897197a7d	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:09:55.467715+05:45
e475981e-af67-4bd7-aa39-988e1ce100ec	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:10:01.268899+05:45
fefdcf5c-1992-4463-97f5-317c8417fcdd	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:10:01.345719+05:45
94c110c6-f169-4d2c-9641-119013f095f5	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:11:22.084827+05:45
6cc79027-355c-4a63-9c10-d0d80cfbe250	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	ff0c68d0-4349-40ae-a842-1697cf2312d6	\N	\N	\N	2026-07-14 13:02:37.237249+05:45
ad2a9272-4f6a-4f4f-b9c9-695d9bfa4550	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:11:22.114388+05:45
22768003-af99-4514-a8e3-268abfffefdc	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:11:57.582146+05:45
aa64df33-58ae-4744-b85f-605a176fbe24	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:11:57.655731+05:45
64d5c015-75cc-42e8-a99e-badf92e5c1b0	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:12:30.45711+05:45
c2fb161b-5e6c-49c1-a685-697ee163fe87	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:12:30.516423+05:45
08ef9434-70f3-47a5-a4da-2a43a7a3b582	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:13:21.883271+05:45
17c6059a-2a8b-46ed-8a69-202ba170f843	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:13:21.966289+05:45
61239a60-af6a-458f-b38b-b453af18a3d0	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:13:52.850283+05:45
c491f3e1-bb72-4311-b5e7-5d77dff73322	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:13:52.91237+05:45
be22e32d-b982-4274-b326-e9fc82443619	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:15:14.276961+05:45
9835e2fe-60a0-4b67-ba71-adb04ce5e220	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:15:14.310247+05:45
329fcb0f-514e-4ab9-a37b-04f0ef4abe37	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:16:50.64552+05:45
9b202ae8-d6d6-4a27-8b0a-d910b93be296	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:16:50.719015+05:45
fec42769-c84e-4db0-9004-fa7778429f91	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:17:59.012272+05:45
dd441ab1-2e9b-40a7-95e2-a782750269a4	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:17:59.050021+05:45
15423a4d-0399-41dd-9457-ece150c6493c	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:18:21.01879+05:45
da1090aa-675f-441d-b847-fb3add93b23e	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:20:01.582128+05:45
caa73337-5434-47d2-9724-e96a283639a7	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:20:01.834433+05:45
69be48df-6822-45ad-8c26-12118f4fcd62	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:20:01.869714+05:45
6ccd06d1-05f5-413f-8e23-b18651479f01	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:20:33.465885+05:45
c59e457e-0d77-4165-b94b-c6579d7c872d	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:22:14.248602+05:45
ced0e07a-7e7e-401e-9158-f48d5a5c8b6f	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:23:10.628457+05:45
1b828881-89cc-4076-a470-7914e36cdeb8	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:24:31.266765+05:45
88dfd01b-840b-4ec7-aa89-f18d44d00e31	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:25:34.026489+05:45
7f18e20f-6cb4-4fda-a83e-25b763c08f80	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:26:28.449666+05:45
fcdc1d0f-6fc8-4f75-b0f9-9c2f87ce8f4a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:26:53.35509+05:45
60dabbac-2b69-4a25-85b7-fb4ff1e39921	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:26:53.409002+05:45
647dbc50-bd9f-4112-a38d-a6831d9fbaa4	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:28:18.617288+05:45
f7183043-bf84-4d73-a071-97233ed00bfc	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:29:31.853833+05:45
f9185f0e-d12f-44aa-870b-3f3c6feb500e	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:30:31.580765+05:45
1c06585b-bbe8-483d-a094-da0ed5a642b7	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:31:41.832976+05:45
717d6435-1134-4b40-b7e1-6bede57bab23	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:31:41.860347+05:45
7a18bdcc-a6ed-4d1b-83da-b8d77a1fa842	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:31:53.999348+05:45
07e6c69e-802d-4fab-8dac-1d29357711e9	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:35:14.082308+05:45
e6fdecfa-e89e-47c7-9a36-dd93b0de6d92	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:35:14.283925+05:45
03f1f452-3755-48b6-98ea-318cc4c6885f	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	ff0c68d0-4349-40ae-a842-1697cf2312d6	\N	\N	\N	2026-07-14 13:02:37.255672+05:45
dc5ee9eb-6cfc-4c6b-9b97-37f4530282d9	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:42:54.983239+05:45
bb69e447-8376-4a66-8678-2d0ab63f1f78	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:42:55.013786+05:45
591a836d-c38b-45ae-9474-e16d4d3fe996	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:44:33.579122+05:45
e44248a8-132d-4781-a079-91fdc9033f11	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:44:33.637611+05:45
f356bc4e-4066-4977-9887-a88a177da24c	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:50:51.865099+05:45
018f0143-072b-445c-9f55-adb692f2d18f	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:56:16.226186+05:45
b0643f57-89ec-4ca7-bada-8ae4efd38950	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:56:16.253707+05:45
fce3b92b-82d8-4525-8194-72579184267f	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:56:28.959868+05:45
25a79b91-92b7-46df-b148-565ae330bd90	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:56:29.012306+05:45
c64f9816-f5e5-46ac-a60e-bdaea40e7a2c	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:56:37.600857+05:45
365e5c86-1a68-42c8-b538-9584b72b8719	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:56:37.625358+05:45
426aa10a-c354-497b-85b7-5866fa4b138c	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:59:57.206444+05:45
3e5912f1-3e7e-4ce8-b7ed-765e697027c8	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 16:59:57.288658+05:45
514d7696-e996-4ac2-bf2b-78c79da8ea4a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 17:00:00.16973+05:45
fee9994d-3617-49be-8d4a-33dd32e900b6	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 17:00:00.234708+05:45
abb012a7-4e94-4294-8f5f-bbbe08d5a89b	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 17:08:47.153549+05:45
5818b9d0-1650-469f-88dc-ff8e5f46edc5	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 17:11:56.674031+05:45
ce870f50-085f-4865-9a4b-bab88c851f40	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 17:11:56.70962+05:45
fd305fb5-9ce0-4a48-9a5b-77b0c4092a9e	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 17:12:10.393931+05:45
2a6bb724-8ec2-46fb-a993-a5c8ba3b9b0f	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 17:12:58.265241+05:45
179b9246-15b3-4bcb-8c23-adfcb9a02d03	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 17:13:45.139188+05:45
ed908817-816a-49b8-a258-435e100b054d	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 17:16:56.382542+05:45
fc536ac7-1fb4-4e50-af62-b715db6371ae	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 17:16:56.826544+05:45
6994adc8-ce62-4e26-8bed-7b8ea11c434b	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 17:16:56.970696+05:45
ca5f8b6f-8efb-44aa-8017-00a9a87ee456	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 17:17:42.934275+05:45
bfc2d96a-01fa-45be-ab99-bdae8b392676	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 17:17:42.973191+05:45
8220a2d3-3b70-4d41-81de-8f83723ea6b0	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 17:19:45.737249+05:45
15c6a00c-9dc1-4cde-8a75-f67fdad2b3e4	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 17:19:45.800273+05:45
4f950332-74c4-4a30-abb8-60c16e9b0e0d	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 17:24:12.173535+05:45
c8937480-506f-4ad0-a370-ea3546e58b00	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 17:24:56.163106+05:45
c649ad58-c7eb-404b-8cdd-a802f008ab85	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 17:34:09.510351+05:45
d457fb4f-aa6a-4b37-a93d-844f0ccea30c	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 17:34:09.695026+05:45
edf2d96d-5466-444d-9471-75a61252f32f	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 17:34:09.754514+05:45
faa597ce-e5b9-4bbe-8f1e-132fe5af649c	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 17:34:59.461599+05:45
40ae9ff6-f93d-4ac9-b8f5-8db29eb99ec9	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 17:34:59.486943+05:45
4c4e0481-4fb9-4007-94cf-dc9a55bbb101	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	7cea6840-942b-4153-a63b-20c0a77099d6	\N	\N	\N	2026-07-14 13:02:37.25807+05:45
e556a772-2c49-430c-991c-01872b7d42ae	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 17:35:12.09882+05:45
4be20776-b24c-4d8f-8f01-7ee04056f6eb	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 17:35:12.112032+05:45
779afe31-83b1-4ecc-b795-6936ae18821d	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 17:35:26.832748+05:45
5f268d3b-7640-4ee5-a6b8-7d36ede3072d	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 17:35:26.856414+05:45
1e8e50b0-8c0d-47b1-9111-a2f54593cec2	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 17:37:30.208277+05:45
fbf3d594-71e5-4dea-9d57-3704f3209f0a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 17:37:57.205829+05:45
de44bee0-9322-4997-ab52-376b075bc09a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 17:38:05.169886+05:45
d3cfc068-0ecb-4084-8318-61c757d5f9d2	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 17:39:53.173772+05:45
ca4af470-ed92-4031-8574-03a0d2df1882	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 17:42:07.290975+05:45
a7cd98c7-606a-46bd-be7c-ae7fa8dbdfe4	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 17:42:12.161446+05:45
f963a7fd-d559-40a2-8073-4b6a16f652ec	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 17:44:54.173758+05:45
9af96082-ec94-402d-8e7b-d7c79d11a7b4	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 17:45:02.152538+05:45
e2fadc0e-d1d2-4fbc-9e85-2dc60b087a3e	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 19:12:27.458136+05:45
bfd9c54b-1d67-49d5-9aeb-9d25413974c6	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 19:12:27.613601+05:45
d9bc4ed3-d954-4e63-b1d5-5a0e4d98aa67	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 19:12:27.622883+05:45
93592b3a-cc15-480d-9fba-9894e3a00b43	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 19:12:41.77625+05:45
49acbc14-3be1-4115-af97-5b1116678ab5	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 19:12:41.790342+05:45
db52cdbc-b923-4e13-9fe2-1d43140e91e9	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 19:17:46.095645+05:45
afe13b5b-6940-4a5f-b1b1-b197d28b28e3	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 19:18:02.871417+05:45
d0221664-4af1-4b4f-975f-238eb013e8d7	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 19:18:02.921162+05:45
f45bf342-a955-4d30-9151-28060f96c93b	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 19:21:51.811867+05:45
2cfba4c6-a122-495d-9ab9-d6c9613eb70e	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 19:22:39.955388+05:45
18c72ef5-370d-4bec-9f05-0e0c93d2b4ff	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 19:22:39.970205+05:45
edb6645a-6306-45aa-b65c-4bca4b751aba	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 19:22:50.950994+05:45
6148f4cd-6f9c-4c99-b4ea-d92cb8f0567a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 19:22:50.961086+05:45
bce3b592-8f78-4a15-a973-eaf7b0fc9ba6	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 19:23:03.140956+05:45
5df75ce4-83c2-44ac-93eb-9029d8017af0	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 19:26:46.713891+05:45
6eca9b20-3fe1-492a-960c-b47a59ae3534	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 19:26:46.749691+05:45
ff80037a-cea3-4fcf-9ed2-c1c16986d9a5	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 19:26:55.531432+05:45
1d92bb78-4404-465d-aabb-1c9b3acf218e	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 19:26:55.554816+05:45
b8254487-b2dd-4461-abba-7f816bf328ac	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 19:28:45.835072+05:45
964774ab-3e05-4cca-b448-15722a3dfed7	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 19:28:45.850381+05:45
91e4178c-fc07-4ef0-b3e4-072d0e34afa5	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 19:29:59.284645+05:45
43cc1d38-fb6d-4768-94db-19374b12d7ae	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 19:29:59.298132+05:45
e6a49dbd-32a5-40cc-8398-9c38ec968c1e	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 19:30:08.74274+05:45
494cfd5a-9162-4a73-aa19-3cbd3481cc44	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	7cea6840-942b-4153-a63b-20c0a77099d6	\N	\N	\N	2026-07-14 13:02:37.275424+05:45
7881faae-5a20-414e-b411-1bf303785e4c	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 19:30:08.759032+05:45
0f39aace-d615-4bb1-adaa-fb960a9e37b2	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 19:31:03.014468+05:45
c06d33cd-ecfa-46ab-a2e3-8024ae03e9b7	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 19:31:03.030505+05:45
3ea092a0-15d1-4665-96bb-c7a717fd544b	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 19:31:03.591516+05:45
daabd94f-2e95-49da-91aa-f64d7f489de7	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 19:31:03.605125+05:45
614b87bf-271d-46b5-b7d4-98c6927be0a5	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 19:32:38.574864+05:45
c7674744-a027-4174-9366-4d4bba4d750c	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 19:32:38.604214+05:45
0cc3ee26-fa83-4f94-9db2-4d129cea2fe9	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 19:33:53.785778+05:45
cff8d655-90c6-41c6-a2ae-638f8e44345f	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 19:33:53.800534+05:45
bdc3f7d6-7998-4661-90f3-b6b6589067c4	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 19:34:50.172642+05:45
cf4b587d-a7f5-4eb8-9c3e-9f0c3c0a5984	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 19:37:31.184396+05:45
d2c5e31d-5947-4691-a20b-a4e79a0aa6c6	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 19:37:52.134177+05:45
9fe635fa-483b-4da9-937a-5b6ca901593a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 19:39:21.502013+05:45
ee0f66f8-2d71-4dff-bf0f-5d06dd65ba49	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 19:39:21.514666+05:45
15049929-2471-4c87-9fdb-482c48b40aeb	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 19:39:50.737668+05:45
571badca-5d11-4b55-8733-df783f8b630f	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 19:45:00.316431+05:45
431143f9-f27c-401a-8b92-ed64d6fa5180	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 19:45:19.889497+05:45
b7023507-7168-4ecc-bc81-f9a6c0fe3fcd	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 19:45:47.125462+05:45
fb231faa-ae1b-424f-81ca-600e0db646d3	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 19:46:55.278495+05:45
5156a2dd-4140-4f33-915c-bac8f6f9b590	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 19:53:57.552204+05:45
68a26ef7-7b3a-495f-9796-e78d522091f5	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 19:53:57.630755+05:45
fa291468-7546-412c-8181-fec1f86220ca	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 19:59:41.359795+05:45
858517cd-20d9-4682-8288-3d5a21a53dbc	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 20:00:34.776017+05:45
da2ecaa2-008c-469f-a9c2-9c837796b2a6	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 20:00:34.838458+05:45
fb4890f5-1ff9-47e4-8fdc-e4d8c83db862	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 20:00:40.204548+05:45
e9315f7f-9988-4e7f-bac2-f7eab1f981dc	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 20:02:52.423353+05:45
c9324563-decc-4bce-a1c2-7224bbc68e1f	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 20:04:30.33813+05:45
94da0a33-b37a-49ed-8940-08618dc9d40d	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 20:05:42.195357+05:45
c665c5c5-ae34-472c-afc9-ddbb70ad8a5a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 20:06:39.374735+05:45
c2af1b62-a275-4fdc-acce-bba59e50a695	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 20:07:44.699392+05:45
28c28a7a-9886-40db-8e3a-ca6045e67b1e	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 20:08:35.286309+05:45
030a5a57-b71a-46d7-9df5-6fc2741e6ee6	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 20:09:24.279384+05:45
3fcb2ed5-8d71-4fbf-9cce-c12cabadb566	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 20:09:24.458022+05:45
4f07e123-e57b-46fe-a286-6cd3be9d69fd	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 20:09:52.217472+05:45
6e11e5db-95c5-4e03-bf51-fd93ed8aa506	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 20:15:56.333277+05:45
0fcadfea-add3-451c-b58c-137345ff7ff0	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	72004646-6a57-4314-8238-ef1381a81a09	\N	\N	\N	2026-07-14 13:02:37.278254+05:45
fa21d880-d090-4473-bb47-1504921ec2b5	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 20:16:39.344904+05:45
0ea6b07a-76a9-4139-9978-cc65fdf125cd	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 20:27:39.238753+05:45
bd2ed215-b128-4820-ab5f-2ff7920091ed	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 20:27:39.583858+05:45
7181bfc1-733f-4914-b698-ca45bce63e7a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 20:27:49.182605+05:45
e3184ea3-2c45-40ce-babb-69c53ecdbbd0	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 20:28:04.290461+05:45
fb294dec-2c99-4a9e-8737-8cd847dfbda3	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 20:28:04.36341+05:45
933c8ae6-7425-4bea-b7f5-40c74b05f4fb	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 20:28:25.953841+05:45
1e882b5d-8a50-48f4-9589-eb098951bc92	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 20:28:25.999655+05:45
817c8a4b-a18f-4fbd-a88c-e7e58d4d0407	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 20:28:46.223306+05:45
de92c607-71f7-48ec-b747-0ae1eeedbc06	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 20:28:46.262797+05:45
1fad2ae4-b329-417a-ab39-c708911376c6	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 20:32:28.549656+05:45
ffed4ea7-d40d-4146-bc8d-d354f894afae	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 20:32:28.575252+05:45
7e5d41a9-72a0-456a-92c4-0b5baef817a2	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 20:33:38.189712+05:45
f60c27fc-192b-4fd7-b642-7829997fcc17	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 20:33:38.22066+05:45
9b9d8fa7-ad49-4b33-b536-2ceda48d5c13	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 20:41:52.397852+05:45
350a57c3-bc45-4792-a311-6eb9844f795b	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 20:41:52.421961+05:45
0c250a29-0bcd-49da-b9a0-73cb90e4635a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 20:41:53.129367+05:45
f226c7d7-68fb-4359-9274-c2edba1ebb93	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 20:43:01.523145+05:45
ab1824a2-e449-4901-8089-f0f91afaec72	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 20:43:01.799869+05:45
9bd8cfde-5878-4e6c-8532-bc55940aef5f	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 20:43:01.824044+05:45
7e9a3d5d-a0b0-4111-9ff9-37c1cf5ccdb3	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 20:43:30.147606+05:45
efc34dd6-045f-45db-b571-15402d6bb8fa	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 20:43:30.184903+05:45
dbf4bcac-4bda-4d8a-aab0-5d12395d62c0	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 20:45:44.246834+05:45
c20ed6d0-e219-4a4d-9b38-be5927baef91	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 20:45:44.27583+05:45
8b54700f-3418-439c-84ff-3a5a362c91e7	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 20:46:25.11084+05:45
b016de0b-ea3d-44f2-8337-1cf30ec99aed	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 20:46:25.141448+05:45
f869207d-3433-455b-8d41-9ac50d6f7896	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 20:47:16.079373+05:45
42a7e1f5-7b7c-4308-9912-b52c23d66cdd	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 20:47:16.109756+05:45
4ecd731c-f624-46df-a1de-a81e2c8911a5	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 20:47:40.484988+05:45
7e06827a-8577-4d4d-b113-1750e28cc98f	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 20:47:40.533407+05:45
051d3247-36e6-4d14-b273-c9ddbe7d2424	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 20:48:23.852413+05:45
67f1d061-0d53-4ab5-98fa-8fec9939800f	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 20:48:23.882572+05:45
e1d14475-4edf-4aa0-829c-690e65031a67	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 20:48:48.218186+05:45
f9c47484-1d5d-4127-a5b6-9d5cd906f0b3	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 20:49:16.247259+05:45
3e0bef54-e7e6-4ed9-b4cd-e3755de5a634	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 20:49:16.280485+05:45
79afe2ef-e885-4ff3-80cf-ac643cade83d	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	72004646-6a57-4314-8238-ef1381a81a09	\N	\N	\N	2026-07-14 13:02:37.294769+05:45
7f09b3cf-e2b7-4b21-aac4-4e2b1030870a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 20:49:33.438561+05:45
059270db-7137-4126-a8af-d9d331ec1fac	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 20:49:33.468441+05:45
7e68b402-0a88-4149-987b-e28433f8ba6c	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 22:45:56.059407+05:45
25774fec-ae37-4f82-b1a7-49c1f108fb06	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 22:45:56.410079+05:45
f26c6450-e59f-47d9-813f-b3550365a632	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 22:45:56.431018+05:45
c150c90f-8628-4022-8f04-9dd7be3ee9d7	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 22:46:08.870554+05:45
62d64821-6b7b-4b48-8a19-a488a173bd83	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 22:46:08.905062+05:45
2676bcce-42a9-47de-ab8c-d702d5cf63c7	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 22:48:42.415324+05:45
1c04fbf4-ed6e-4c3a-9e85-e8e7308c39c9	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 22:49:44.396981+05:45
8da01aa0-f0e0-4fc2-9dd4-a3c08c260ba9	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 22:50:59.414632+05:45
6fb0437a-5948-4234-9973-b04ed472c00c	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 22:53:17.374691+05:45
cac95556-92ed-4763-b11d-58f2d4e077ed	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 22:53:17.397974+05:45
5514716a-0489-438a-9829-bb22a97afb50	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 22:53:25.359313+05:45
54073b7f-8921-44fc-a85f-16e5c27b8308	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 22:53:25.389061+05:45
ede27408-c021-4310-a7ff-137e4b60d56c	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 22:53:28.668891+05:45
df787e22-b13e-4621-9ef0-bb49e9285d40	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 22:56:22.311694+05:45
3a00e397-a041-4282-8f4d-e7277ff757ff	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 22:57:51.329924+05:45
23561b99-2fd2-4889-8e2f-bfa1bf0949c6	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 22:58:21.201488+05:45
50f646f2-a3ba-4fc4-b545-6b361849f8c9	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 23:03:39.84879+05:45
9ab4a10a-6832-4497-bfcf-2cf738ccf108	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 23:03:40.20498+05:45
c1566471-57aa-4b14-b95e-8154850ffa08	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 23:03:40.41226+05:45
237c483b-02fb-4099-8dd3-7226c3c6a99a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 23:05:12.392598+05:45
c39885f8-f9f6-4482-ab4f-54d274b5bf2e	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 23:06:40.677011+05:45
7493daec-b73d-41d8-bd9e-a55031f1f347	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 23:07:41.022627+05:45
17e1d83f-ba8a-4cbf-b0de-a43dd9733c31	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 23:08:48.426834+05:45
73c3a2a5-5a76-46e4-b87a-d085e6a73723	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 23:09:34.827704+05:45
2b3d0e1c-0391-4706-add3-1e9a6096b48e	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 23:10:35.175382+05:45
3cbd724f-9299-4007-af14-cb2a49d272a4	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 23:10:55.891721+05:45
ef17abc3-7c4f-4eac-9d8b-dd512974784d	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 23:12:17.369444+05:45
2c4ad83d-9cb9-4240-9391-7dbaba18fbc6	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 23:12:52.416983+05:45
10efc5cc-9eef-47a5-b28b-8f2f2d6c80be	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 23:14:17.518375+05:45
f1166c72-41ae-4c7a-8c28-fabe8b5bad7c	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 23:15:09.345647+05:45
cf74caff-670f-45b2-bc68-9b117e2be5b9	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 23:17:01.418268+05:45
4165002c-e0e4-467e-984c-7c5aea6ff1e7	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 23:18:32.464631+05:45
f6b0f11c-31a3-453e-b10b-fe1aaeaad140	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 23:20:21.260451+05:45
c514cf47-fe89-4f9a-88f5-b0b102599063	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	e99c74dd-4e79-45ec-ade0-770c46f4105b	\N	\N	\N	2026-07-14 13:02:37.297148+05:45
60eb3ec2-95b8-4766-b792-cb7456d84256	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 23:20:21.454327+05:45
1a7245d5-5c80-44f5-b34e-de53a315f222	11e156f0-797c-41c2-8322-5603e60a5fd8	LOGOUT	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 23:20:38.913029+05:45
e54636a7-9ff0-433e-8849-3a065ecb7dfa	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 23:20:41.78113+05:45
82f8ac2e-3513-4960-8371-82a20073e346	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 23:20:41.841517+05:45
7008f318-baf3-4285-9d9a-51bda6fd437e	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 23:21:22.375278+05:45
22529f6d-2032-4c6a-a03c-aad57ccd1fe4	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 23:22:51.325708+05:45
9e9a9cda-8aa7-4d81-9a73-6f1d88b00ab6	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 23:23:41.38721+05:45
987dfeed-0d16-4769-a610-89d894ba7a90	11e156f0-797c-41c2-8322-5603e60a5fd8	LOGOUT	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 23:24:24.630653+05:45
c8da3e06-ce14-4e0e-975f-16e5431d7638	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 23:24:28.161436+05:45
0411a602-4002-497d-a45a-667815836222	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 23:24:28.176772+05:45
1665cbbb-ae34-4914-befb-d7f0ba2de6fa	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 23:25:27.866132+05:45
763d2622-cc6c-4605-8c65-a570b3ff8b72	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 23:26:44.440089+05:45
ef66cd2a-05cc-42e3-bd6b-7070f33b51c2	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 23:27:17.758465+05:45
3bebce0c-9cf3-47eb-9f26-fbfafa366185	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 23:27:17.768667+05:45
5b2f2d90-1aa7-4b30-b33d-2a0ba51db2da	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 23:29:49.265625+05:45
2f8c13cc-e6b2-4c91-9502-599514b3a0d1	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 23:32:24.182482+05:45
843907d2-b52d-43c0-90c9-262f3874eec3	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 23:33:23.700373+05:45
c85b5a3f-2bc6-4409-9ed8-5737933d0780	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 23:33:38.135161+05:45
fa5e2643-25a7-4c12-846b-9e8c6dfd83cb	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 23:34:53.307932+05:45
c71346b6-7863-40f4-97ed-37a63090d515	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 23:36:06.180831+05:45
354c9ae9-f76d-415f-a908-5e39765f7ba5	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 23:37:36.305247+05:45
083be17e-6031-4c6f-b47b-3231443fa806	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 23:38:56.181697+05:45
a28678ee-2bd4-4c6f-a507-3082a1d4c37f	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 23:39:53.260477+05:45
027a9a5e-bca4-480b-b325-516e8db92901	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 23:39:53.340034+05:45
32ab3614-44b2-4ebc-a077-480d369b264a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 23:40:57.16681+05:45
5186ee1b-b7a3-4396-a922-b57ee15d6fe2	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 23:42:06.163985+05:45
373f8b6f-f181-4844-860b-bde4d40da52c	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 23:46:36.168618+05:45
b721871b-d579-4070-99df-3d85b3ee26ab	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 23:49:25.186962+05:45
a7d061db-43cc-4f9c-bfaf-6112d4b00126	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 23:51:58.248641+05:45
2ddf2a4d-e0d4-4b29-8a07-38293792f616	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 23:56:00.279631+05:45
ea2c7d95-c4c6-4360-83cb-50e35727e092	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-11 23:56:00.370482+05:45
88f70ee5-c248-4056-94f2-945339c49b09	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 11:59:42.825784+05:45
32c6d32c-6fa8-49af-872b-fbf73588d5e5	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 11:59:43.104347+05:45
202ed9b8-5f87-47b6-aff7-407b5d66686a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:05:19.665304+05:45
7b2806d2-3221-496c-bd8f-1be029a2d6cd	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:07:10.347945+05:45
e701a6a5-bedc-42fd-832f-9cdbe361a688	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	e99c74dd-4e79-45ec-ade0-770c46f4105b	\N	\N	\N	2026-07-14 13:02:37.319202+05:45
b2491536-f339-42dc-82fe-90ea75309bde	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:09:01.040078+05:45
678cbb34-6421-4460-8647-7aa20537aba3	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:10:20.261479+05:45
6776d65c-1bc3-4fd1-bdab-c4b79f011219	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:11:41.958941+05:45
84f5271c-0d23-4f1e-9f0c-a8a368c311d0	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:11:42.150443+05:45
48c464b4-48e2-48b8-9d11-b29abaaa343e	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:13:37.640163+05:45
7c8fbddf-2fba-413d-91ab-7cb59a55a1fb	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:14:40.828706+05:45
616ed4fc-2754-4066-b9e8-2c89cee9ffda	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:14:58.349296+05:45
60a887bb-512c-4f2e-9af5-6ff48a3e9271	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:18:50.333456+05:45
12bb7ef8-5a0a-4a6e-be23-54801516ec6c	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:18:50.354856+05:45
8e14cb86-863f-48f7-9192-bcd76ff82605	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:19:00.331942+05:45
ec344ea0-194d-4465-a13d-158c060563aa	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:20:20.470819+05:45
99337fa2-8f41-453f-afb9-e669c19bfaac	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:22:32.654166+05:45
d6604961-1966-4778-9276-844bed224c60	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:23:39.162429+05:45
f82dc712-36f7-49d4-80f9-be01df158ce7	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:24:15.196189+05:45
510bd119-4b1d-45cd-99fe-a04459a8adae	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:24:15.218964+05:45
fb5281c8-b818-43e1-b81f-ec5102103f4f	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:24:32.842224+05:45
fe883d3a-8c4a-44ec-8e7f-177d9db39577	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:26:18.361711+05:45
af6d9bdd-1040-400c-8578-7443a42160d5	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:26:31.429574+05:45
6e4e5d11-19e2-4d32-b44b-4121c4a60806	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:29:41.275207+05:45
f826430e-0f1c-4262-8cf7-32984bddf135	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:29:41.539757+05:45
1a0db0e0-2fd0-4327-b215-e9608537200a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:29:41.563359+05:45
f240a7e3-fba3-46dc-9bde-df3475df7295	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:30:42.580564+05:45
bd8a0386-2a80-4e9f-b6fb-b57eeebc437e	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:31:48.131394+05:45
646da6b6-3b3e-41c9-b48e-3b73f07062c9	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:33:38.489723+05:45
227a3ae4-331a-45ac-b978-f58ddb2ff091	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:33:49.131555+05:45
23e12250-5c83-4071-8162-d66c3b1a1016	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:34:20.188568+05:45
607d8e7a-685d-4d2b-82a2-cf7a8f7fe369	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:34:20.211598+05:45
0d81e8c1-b469-45cb-b2cd-1e8ff392971a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:34:39.654967+05:45
a34cf704-53ec-44a1-b588-9e6abee69716	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:35:02.311957+05:45
6fb0e112-21eb-4cb0-a8c6-e9b5edfa5d75	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:36:26.817888+05:45
02582049-89d2-4f32-8287-b7d79f414ede	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:39:03.452861+05:45
10fa8e6b-7551-4670-8709-1cc148fb2f2d	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:39:44.491674+05:45
d831ddde-402c-41f1-99ad-3b4d73bae05a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:39:44.512876+05:45
f0c89e60-6f51-4b32-8a77-dec9d1cf0f0f	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:41:06.31719+05:45
9b06d856-7bfc-4dbe-8b2f-4f5202fd2a9b	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:42:57.092216+05:45
8186b379-b82d-4c31-b6bf-dcf6aba327ec	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	f8839b54-6176-4c54-9ba7-5e1a8d698341	\N	\N	\N	2026-07-14 13:02:37.32219+05:45
bc8e6a2f-16aa-40c2-8082-61614d0ca07b	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:45:43.298991+05:45
44274e1e-f0d3-4cbc-b5b2-57c48a06e14b	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:45:43.486142+05:45
57eb8fb1-8756-40f6-9d0a-06dd54bc115b	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:45:58.155276+05:45
ddafad43-5d81-4b0c-9528-a719902a0805	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:47:28.183934+05:45
3f2cac14-37cf-4e83-b93a-871aba8666ff	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:47:49.022697+05:45
84fb4cec-8967-4cf6-b58e-3d5d37f7730a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:48:40.060678+05:45
a165ce71-a74f-4dfc-95e5-68bd1be8f69c	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:49:03.45759+05:45
6dc42957-42f6-4bfc-8c86-03f47b162d31	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:49:03.478958+05:45
96b69b0b-66b2-47fc-86f6-95c0a9aa6508	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:49:07.777807+05:45
2312ffc9-99d4-4cd6-b78f-9ed3643e1fff	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:49:55.634193+05:45
badfedd6-dec6-4407-a42e-2ac296fa9623	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:50:56.21107+05:45
506e58a8-7c5a-42ed-9e00-346e19a1cb82	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:51:18.142254+05:45
34e2f7d2-d1d4-4aae-9561-ceac30e9c234	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:52:52.472795+05:45
7f9af836-963e-4e37-a1b0-84e2644bcfdf	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:55:32.339536+05:45
a17b7bf0-ee6a-4e1f-90a9-bd067d6f69b0	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:55:50.983855+05:45
93d64f3e-41b8-4d89-9981-f4f9c2e9501a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:56:39.386164+05:45
4da3949d-2684-4a7b-85fa-b228958a5cdb	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 12:58:07.065434+05:45
6e0affac-9ea4-4753-9aad-b58f3bc5e2c5	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:00:25.996688+05:45
b74755f7-eb4e-4c57-bc2d-912af0e2dbc7	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:01:26.535922+05:45
5a02af95-e544-4d24-9c34-adf98d25906c	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:01:26.726428+05:45
b789d918-30c9-49f4-aec0-f63a01438961	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:01:52.302281+05:45
ddd3c204-c098-454f-acac-903ff94b487c	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:03:19.160535+05:45
c17f79ad-ea57-4f8a-afae-aded1321ed37	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:18:36.232847+05:45
adbf3e45-3f87-4c0e-87fb-d307a3218a4b	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:18:36.596688+05:45
6bba53a1-a740-45b1-814f-8c66f7d64fe3	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:18:36.637879+05:45
d27ab72b-e9e2-4b6b-b1c1-ab22cf1719fa	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:19:09.247337+05:45
e536098f-2af5-44f0-b74b-40ec13ebb1ec	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:20:07.993152+05:45
0806e56f-5550-43ec-a394-2810f24cb0e6	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:21:31.61994+05:45
01fe4426-1b16-4bf7-80f3-bd8f057f0fe5	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:21:49.242679+05:45
e649a5c9-3af3-4d6f-b7ce-fd7b19c58a1a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:21:49.25615+05:45
9d31b147-6421-4131-bf42-17cbd482444e	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:22:30.178157+05:45
e7e25c14-031c-4ab7-8ba3-f2e5f45ba91e	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:24:38.552974+05:45
4a0f72b4-71cb-4b28-a275-1d2455bc80b4	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:24:38.564373+05:45
5928bb66-42d5-43a4-a420-db7406a9f698	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:24:42.677665+05:45
17ca650e-dc26-46ff-9f70-0fe4c1c690bd	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:24:42.689928+05:45
3afd7dc2-ed5e-4b3c-bbb9-802613cdd06b	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	f8839b54-6176-4c54-9ba7-5e1a8d698341	\N	\N	\N	2026-07-14 13:02:37.356919+05:45
0b13b49e-41e5-4bef-b046-81cde28927db	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:24:46.565667+05:45
ed945b67-595e-4bc6-ab42-f658c9a7db18	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:24:46.57668+05:45
5c143b41-f598-4044-83a7-f118de795b4c	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:26:10.510674+05:45
3e6df580-ac98-4b41-8473-81f863b6ab46	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:26:19.975535+05:45
40696ed8-0025-4dba-9ca2-8f920165aa53	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:26:19.997068+05:45
dcab63a2-cd33-4d01-be99-f40c32e0476b	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:26:38.951455+05:45
1c19aa15-6155-44e8-b585-b78525f5854e	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:26:44.274539+05:45
ee5cc020-8451-422f-8f8f-0c364feb01b4	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:26:44.304029+05:45
d4f4d5b6-2bc8-4fe6-88a9-5ab6aa4f6064	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:26:58.180428+05:45
a5a3ab47-f032-4797-9574-f8b6c268e820	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:26:58.208405+05:45
a25467ac-fe86-4755-b392-86c4777c1c62	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:27:58.157667+05:45
ebde1eb4-5526-4fca-8887-b31d6e15f3ab	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:27:58.167942+05:45
80a39f1b-1fcd-41e9-a28d-a6ff1b199197	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:28:43.074258+05:45
44842cd9-d7a8-4b15-9acf-7c91bcc488fc	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:28:50.823945+05:45
c911ea04-aa2e-4a5d-984b-6093de69331b	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:29:12.639219+05:45
6821edd5-bc4d-4ca5-8422-b454a8869c0a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:29:54.672182+05:45
adb4e9cb-90b1-4939-9219-799c45c9e938	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:30:01.928193+05:45
accbe0f1-d0d4-4477-a3eb-914b84d8185b	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:32:09.463437+05:45
f44dfcb7-dab6-4e25-ab4e-3f4e4892735a	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:33:42.50361+05:45
8b1b2cda-6a0f-4c14-a0b4-e1d740a74106	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:33:42.622725+05:45
ad56819e-ade5-4904-81b0-e75916ab7bba	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:33:57.337123+05:45
333158b3-e109-4e58-8cbc-0429bde02610	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:34:10.999764+05:45
19c04242-b3d2-433e-8ce5-a373c6a31677	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:35:00.101248+05:45
50f70d1d-4364-490a-b9dd-3e7002924e0d	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:35:12.448287+05:45
61882f26-0b4b-40a1-b352-ae570de3ff29	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:35:14.958925+05:45
bf8d1335-9f50-4484-90fc-91595c677363	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:35:15.705628+05:45
13a2a53a-95c5-4c5b-b6dd-5bb162d03a3f	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:35:24.915213+05:45
a71cc480-0d81-465d-b8dc-f7e5af50fe63	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:35:30.475496+05:45
9a3a7409-85fc-4403-a11a-923f1ed58644	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:35:36.209404+05:45
cbc06782-8447-4079-98f6-49a34b0be4dd	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:35:49.454339+05:45
940b6a3b-b2b6-4349-b6ad-a072f78ac883	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:37:03.030547+05:45
e5ea872e-0c5e-414c-a8f5-996b04859c1f	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:37:12.221583+05:45
65282102-4cc9-465e-8e34-6fbceccc960d	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:37:49.46621+05:45
f0d82cb6-bda7-49de-bc0d-1e1698929b52	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:38:11.815703+05:45
2ac2ff5f-dae0-4b67-a7ad-4d08a7afbaf4	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:38:19.028114+05:45
18544004-2085-41a7-96b0-21d73c547eaf	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	c0c866e6-57cf-467d-83c2-a5545fe7d726	\N	\N	\N	2026-07-14 13:02:37.359652+05:45
fdb8bc66-9c67-4f03-9b0b-1fb7da7ac066	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:38:35.070475+05:45
17de1bba-5230-494e-85a0-6987870e40fd	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:38:37.984575+05:45
91d27a78-68a1-4579-b78c-95ecaee342e7	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:38:39.370141+05:45
a9dd7dc8-cd79-4c8b-bf7b-667dd6bb316d	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:38:40.387464+05:45
fe6ba709-2e38-4769-86f6-a85260bd9e9d	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:39:33.472302+05:45
26a0de1f-8ca4-433c-b55b-d240f09930ae	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:40:35.429752+05:45
a6061193-c7bc-4d38-9e46-7cd24f023e99	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:41:59.618975+05:45
5d7e14ae-7e52-4da8-a1c3-a63a7dc2bc37	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:42:00.158496+05:45
fed43e90-a1c7-42ef-8795-db8af9a96c92	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:42:22.847797+05:45
4b46bddd-4bf7-44b8-b5e5-b82560d5e9bf	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:43:41.636198+05:45
79e3094c-ef84-47e5-bc4f-2261dbb59630	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:43:45.138752+05:45
fa70d4ff-df4f-4afe-9120-e55e14d85b18	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:43:47.252389+05:45
286dfe69-5da6-40fa-a79b-8ffefc0b5976	11e156f0-797c-41c2-8322-5603e60a5fd8	LOGOUT	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:43:52.708695+05:45
5a0a1835-4168-43ff-8e43-ce11392341aa	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:47:10.846648+05:45
eefe9149-b776-4afb-90c7-8e1a1d93dbb4	11e156f0-797c-41c2-8322-5603e60a5fd8	LOGOUT	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:47:56.952654+05:45
5739c48a-e0ea-41c9-808f-9e4ea9ed89eb	\N	PHONE_OTP_INITIATED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:48:14.223597+05:45
534174fd-abee-4bee-a159-b664d3b7dbe8	\N	PHONE_OTP_INITIATED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:50:29.178685+05:45
1adee2d4-74fc-415a-8c85-1ca014a527b1	\N	PHONE_OTP_INITIATED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:50:54.362691+05:45
a075dda8-4784-486a-9e46-bb76206fb4f4	\N	PHONE_OTP_INITIATED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 13:54:02.380798+05:45
c3b6cf32-5768-42d5-a296-6ac951f2d5ba	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 14:25:01.966079+05:45
843201f8-89c1-4c64-a798-8f71ee4878af	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 16:31:38.958681+05:45
2e34124d-87f2-4c96-a05f-d0ccb7e39e8d	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 16:31:39.297293+05:45
3ffe17f3-abd3-401b-aa1e-ba3ca7fc66ed	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 16:44:11.799304+05:45
b6f65d28-cd6b-490e-806b-9ee1de73eda8	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_CREATED	consents	c1f95db7-8bc6-474d-9ef4-c147c5acdc04	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 16:45:26.766415+05:45
a18ff494-687d-407f-9344-0f072dca200d	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 16:45:29.25209+05:45
646396da-555b-4c3e-84d6-e75f1ba39783	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 16:57:43.474956+05:45
c04a76ed-4f27-4aac-814d-56a708ec4621	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 16:57:43.727969+05:45
92b981e0-5992-43b9-81ec-1b43737c9765	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 16:57:48.228912+05:45
3896f401-12dd-4454-a8b9-8700833ccbce	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 17:11:51.386417+05:45
0e35df41-be66-4322-b55a-a8d09cd05b6a	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 17:16:30.366348+05:45
3829047a-30ac-4a0c-9e10-c81df9a368fe	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 17:16:30.711734+05:45
2b9549c8-79fc-4eec-b1a9-efbc407e881f	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 17:34:02.295624+05:45
8ce03fa2-4247-4d01-909a-628950f73c7b	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 17:38:06.243559+05:45
f7c55b2a-1ba7-49ba-b561-287074b751b7	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 17:51:47.859143+05:45
ba6555f5-7281-461b-b5f2-d1eef2d2965b	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 17:51:48.204256+05:45
3ad53d36-9dbe-4eaa-aff4-2d2c39aee7e7	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 17:52:16.125229+05:45
77bd1da0-3bcb-4dd5-9064-44c345ba10a2	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 17:52:33.586473+05:45
839a7a98-d1e1-4836-9132-368dc6f82410	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 17:54:09.240961+05:45
9935d1a8-cbd0-4b6a-acb4-6ffababbd81e	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 17:54:43.19789+05:45
7887f0cb-0cf8-412d-9b47-db9144f9701a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 17:55:29.524783+05:45
f4ae2991-ab91-4890-a44c-78d25e2fdad9	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 18:18:39.807591+05:45
e44ac6ea-ec2f-44c9-b39f-10ce6e6c1658	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 18:18:40.207423+05:45
13f4485c-71ae-4496-b82b-6563178518de	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 18:18:53.559379+05:45
1c84004e-db88-4f4c-bffa-58d6403f25cf	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 18:19:46.629976+05:45
b7a8a45f-eeff-4e27-b52e-5bce9e7f0259	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 18:22:45.518022+05:45
c7913098-f9c7-4c54-bde5-37bead5e0e7a	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 18:37:17.71756+05:45
824f3a9d-d482-486e-9446-2838f08e720c	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 18:40:45.542434+05:45
f593f334-99ff-4666-9e72-0578cbfdb06b	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 18:41:10.853883+05:45
852a6763-4271-4a04-9968-192347ec932a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 18:41:40.464442+05:45
b8fe3694-7532-4666-8e2d-fd544b392651	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 20:24:31.978291+05:45
5cc2132e-fd73-4a23-b1e8-4d97513051d6	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 20:26:17.897414+05:45
1839ecaa-2ca1-4081-83a3-aea36d9618cf	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 20:26:30.095917+05:45
69b34773-bdfa-4483-ae21-f034ee405159	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 21:14:58.561891+05:45
3de0d4e4-c1c5-4b29-896b-7915aa7f46ee	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 21:25:59.859282+05:45
c20fe19e-c775-47f8-86d5-8dbd8623b29a	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 21:49:27.376346+05:45
4bb11e5e-d932-4be4-a4d1-08d02a9d4901	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 21:49:29.863436+05:45
35e43d30-a415-4f80-88f3-690f27e8607a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-12 21:52:15.142072+05:45
1e3147d1-e56f-4096-a4f7-9df7323420cf	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-13 11:12:39.703303+05:45
65f8d150-0bca-4d05-9818-e579c9d48b43	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-13 11:12:42.860815+05:45
70b82161-723d-4be5-a756-6bce3dae43f0	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-13 11:19:34.232727+05:45
c106f864-ad16-408f-ab84-9589d8f531fd	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-13 11:21:41.06319+05:45
b2a6a5ec-29f5-4fd0-93b0-f89b4337907e	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-13 11:22:07.008718+05:45
c2eaed02-8934-4fbd-be5c-06145f6417c7	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-13 11:22:27.89555+05:45
9f6ffab1-37c7-4a77-a3df-95dacf4a52fd	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-13 11:22:44.656915+05:45
51d379f1-89bc-44b9-8145-c5693f645bce	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_CREATED	consents	275b71dc-14d2-4a85-8ba3-bd8b8e2a5048	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-13 11:23:30.943821+05:45
f6fd9d27-f1d0-4eb0-a26c-a032ae0d2d6e	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-13 11:23:34.382456+05:45
d3bbd692-b1be-46f7-b809-a059d298fc75	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-13 11:23:39.392222+05:45
d459fd5e-1e7b-42f0-ae62-451fcb6dc333	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-13 11:27:49.421672+05:45
67894da7-c034-45f0-bfae-0410ea6c19e6	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-13 11:27:51.151159+05:45
4272636d-2e19-4a53-8fa0-706af8283aa9	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_CREATED	consents	8a1290ed-3eac-4824-8b23-a7c84470bf10	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-13 11:29:06.706847+05:45
c2b4f55e-4728-45ea-b966-80d22bc63dc1	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-13 11:29:10.098987+05:45
0e3edd85-312d-4a4f-917d-54c56790d884	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	c0c866e6-57cf-467d-83c2-a5545fe7d726	\N	\N	\N	2026-07-14 13:02:37.381078+05:45
5f42c985-141a-49df-a6be-346603ff061f	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-13 11:29:17.570617+05:45
8abba2fa-beed-480a-a668-2bdd2a2d88ac	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-13 11:29:52.560201+05:45
538c010e-6612-4609-ae95-6c5e1ea97b24	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-13 11:31:30.612899+05:45
b9a36c4f-c1a8-496f-94ea-984867e85dc1	11e156f0-797c-41c2-8322-5603e60a5fd8	LOGOUT	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-13 11:31:35.243487+05:45
d7c133fb-b477-40c2-8d38-af5a966ce299	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-13 11:31:40.452955+05:45
84dfb1bd-bbb3-4ffd-8130-b1386486bcf8	11e156f0-797c-41c2-8322-5603e60a5fd8	LOGOUT	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-13 11:31:50.362155+05:45
cfa307bc-6af2-470e-9ea2-2b35ee6f7c01	\N	PHONE_OTP_INITIATED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-13 11:31:57.337562+05:45
52532a04-6942-4862-a5fa-bce05b265795	d88a96a7-775f-41c4-a8ba-927eee2b17ef	AADHAAR_VERIFIED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-13 11:34:49.579028+05:45
95d8f164-bb7b-408a-b53b-dcd7634f2f3c	d88a96a7-775f-41c4-a8ba-927eee2b17ef	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-13 11:34:52.252676+05:45
f391f36f-8fa7-4c78-a7d6-b055ac3929d5	d88a96a7-775f-41c4-a8ba-927eee2b17ef	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-13 11:34:58.58375+05:45
009c7157-cc63-4d8b-b9d5-5ff34fff1093	d88a96a7-775f-41c4-a8ba-927eee2b17ef	LOGOUT	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-13 11:36:10.762585+05:45
38f0ec1d-4d1d-49b5-8f12-37200c59dead	\N	PHONE_OTP_INITIATED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-13 11:36:16.666027+05:45
cb299053-9218-484f-9ca9-bff79279700b	0ea53b57-0787-4982-8d23-270b32e4029f	AADHAAR_VERIFIED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-13 11:36:50.335642+05:45
227c1e10-ffdf-4812-92b7-19493506da9b	0ea53b57-0787-4982-8d23-270b32e4029f	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-13 11:36:53.110705+05:45
400a2b58-0bb6-4a78-a911-2b2de3e62d33	0ea53b57-0787-4982-8d23-270b32e4029f	LOGOUT	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-13 11:37:55.146709+05:45
fd271ba5-b717-4b23-9dc2-af07dcbaafa0	\N	PHONE_OTP_INITIATED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-13 11:39:06.621125+05:45
31a1e1e6-8e6c-4a3c-8740-07ffeac2829c	\N	PHONE_OTP_INITIATED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-13 11:39:13.158811+05:45
93cfcecc-6839-4c57-8690-53e6961f69f4	ffc2e870-3525-4af6-b043-28b7d427522e	AADHAAR_VERIFIED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-13 11:43:39.600714+05:45
c5eabee1-28e4-4be6-bc3b-913d6031192b	ffc2e870-3525-4af6-b043-28b7d427522e	CONSENT_CREATED	consents	9191b265-6f7f-4abc-855e-1bf807e9c30c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-13 11:44:30.743296+05:45
5a10bd42-97a4-4e09-8f97-131aa991977a	ffc2e870-3525-4af6-b043-28b7d427522e	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-13 11:44:33.922408+05:45
64fadf5f-03ec-4a7b-b980-c9ff323d76a5	ffc2e870-3525-4af6-b043-28b7d427522e	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-13 11:44:47.630403+05:45
5ad1d845-421b-4ca9-8c3c-b8b9e3e93c93	ffc2e870-3525-4af6-b043-28b7d427522e	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-13 11:50:11.277406+05:45
7d7456eb-1ba0-4905-a997-00464961d024	ffc2e870-3525-4af6-b043-28b7d427522e	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-13 11:50:53.688743+05:45
7c9d1488-672c-46ab-bd94-2900c8e7c0cb	ffc2e870-3525-4af6-b043-28b7d427522e	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-13 11:51:08.227423+05:45
24390cc0-bec6-4c5b-ad10-7d7501c7d187	ffc2e870-3525-4af6-b043-28b7d427522e	LOGOUT	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-13 11:51:33.890285+05:45
5a7ceb2e-0cc7-43c2-80c3-25a84e9968da	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_CREATED	consents	9d7b8e16-207d-4a32-afb8-a32d43bd559c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-13 11:51:45.018256+05:45
6bfdb9ab-ff11-4598-aa34-54dee99fd661	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-13 11:51:48.173662+05:45
d1f554ae-524f-416c-a1a3-31ab66c585b7	11e156f0-797c-41c2-8322-5603e60a5fd8	LOGOUT	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-13 11:58:23.144093+05:45
2c175978-7afd-415a-bba7-4f5289e36eba	\N	PHONE_OTP_INITIATED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-13 11:58:31.411714+05:45
5ebd4c7e-891f-4928-ae8a-d0f88e7ec29d	\N	PHONE_OTP_INITIATED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-13 12:04:00.763753+05:45
2623acc0-c877-42be-b586-aabd6f495ef1	\N	PHONE_OTP_INITIATED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-13 12:10:00.106158+05:45
a1c522eb-8c7a-4d35-b258-9549baf024c4	\N	PHONE_OTP_INITIATED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-13 12:20:38.514152+05:45
79d3ce46-1fb5-4d86-b1eb-f5320f2a3101	\N	PHONE_OTP_INITIATED	auth	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-13 12:28:32.416929+05:45
b19493bf-79df-49cb-9ddf-4cf198d65675	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_CREATED	consents	7d696d06-1922-4477-b51e-5bad1061c377	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-13 12:32:37.063719+05:45
9991839c-5421-4ef4-907a-d65f421c4e58	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-13 12:32:40.549835+05:45
0fa50a83-38b7-443d-866d-d0f43c6e553d	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 11:41:20.5501+05:45
84eb23a1-ca7d-40d5-b3a4-8d20c63d8982	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_CREATED	consents	1e16849d-faaa-4ad0-8163-6df293edd942	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 11:41:29.780417+05:45
e0ef5a34-9727-422e-ae9a-d59d2a78e9fd	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 11:41:33.001723+05:45
902d5304-f2da-492e-8c17-e5cec1c96287	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 11:47:40.949623+05:45
d72cab4b-4a08-403a-98e2-14b7a2b40c71	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 11:53:43.536834+05:45
dd00700c-b3ef-4da6-93fc-9eebc8652af6	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_CREATED	consents	ff0c68d0-4349-40ae-a842-1697cf2312d6	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 11:55:49.67749+05:45
fd65e66b-4e7d-410c-8b09-a26906f4cbdc	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 11:55:53.341782+05:45
343bca12-fe13-451b-b6f3-739d2dabd1e9	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 11:59:21.168209+05:45
f8de6a5a-455d-47ce-b768-7e3621f005b9	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 11:59:22.287012+05:45
fee748f3-a4a3-4f27-8de7-0ba16722f48f	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_CREATED	consents	7cea6840-942b-4153-a63b-20c0a77099d6	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 11:59:31.359101+05:45
cb7d196c-d276-46bd-8799-bfcf7f6bfba9	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 11:59:34.593559+05:45
16e8d64c-e8fc-40d7-b6d3-c831be7250f4	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_CREATED	consents	72004646-6a57-4314-8238-ef1381a81a09	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 12:04:50.470565+05:45
84dee725-c6dd-4969-97fa-6fc4f3f8ac5c	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_CREATED	consents	e99c74dd-4e79-45ec-ade0-770c46f4105b	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 12:09:43.705379+05:45
5d36e611-3c91-4372-98d2-de560ee6c453	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_CREATED	consents	f8839b54-6176-4c54-9ba7-5e1a8d698341	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 12:09:53.884444+05:45
15dfac17-78c1-4d0d-897f-d9cc32bd113e	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_CREATED	consents	c0c866e6-57cf-467d-83c2-a5545fe7d726	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 12:10:12.70193+05:45
ea31d895-f312-4b0a-b682-0621996f7685	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_CREATED	consents	e8ab72c4-9646-492f-9df8-cf1bad4ed34b	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 12:12:22.168311+05:45
ebd0c591-5186-4e79-9c18-f943f0fafe3c	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_CREATED	consents	00397b6b-e38f-4bba-90d6-de520b5c2f01	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 12:13:04.999474+05:45
6e096b0d-dba4-4779-b458-5a35abdd8efe	11e156f0-797c-41c2-8322-5603e60a5fd8	LOGOUT	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 12:13:40.913302+05:45
0bdc9703-f900-47e7-9cdf-af8ac6bb75c6	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_CREATED	consents	32b4a534-50f1-4d8c-b94b-a711c8451b59	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 12:14:54.800527+05:45
c7de73f2-807f-42ec-9897-800146538cb0	11e156f0-797c-41c2-8322-5603e60a5fd8	LOGOUT	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 12:15:57.351248+05:45
8a0d8572-489a-40f0-bd7b-b8f9f0184fbb	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_CREATED	consents	89558a7d-70f1-4bf5-b3fc-207d2f66a001	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 12:16:43.897799+05:45
65620d3a-9900-4f25-98f7-701c89cdc9f9	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 12:19:23.840201+05:45
81926cc4-ec56-412e-a8d6-21fe1c228350	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_CREATED	consents	76d25c18-aaac-489a-a027-80102353085c	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 12:19:24.40122+05:45
ba8bffe6-0b66-4243-87aa-c6a20e5213d5	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_CREATED	consents	4e74a5fb-7f43-4001-8fb8-fbc24cd39f21	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 12:21:22.480949+05:45
ef595d86-e10d-4485-b919-6d7baf33ae6d	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	96155f45-4c9c-4b52-820c-830b53d6286a	\N	\N	\N	2026-07-14 12:24:03.071698+05:45
c01a9f6c-ee20-42a9-9aec-b07d57d0564c	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	96155f45-4c9c-4b52-820c-830b53d6286a	\N	\N	\N	2026-07-14 12:24:03.096629+05:45
0b77d0ea-0799-4548-a3ed-25a22d117ff2	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_CREATED	consents	e48e8956-637e-49a6-8f2b-47aa86dc37f9	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 12:26:27.901861+05:45
3e9ad777-0492-4cd4-92b5-ac33730050c6	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	e48e8956-637e-49a6-8f2b-47aa86dc37f9	\N	\N	\N	2026-07-14 12:26:27.917774+05:45
63eda885-5b8d-40df-aa66-dac908f73c55	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	e48e8956-637e-49a6-8f2b-47aa86dc37f9	\N	\N	\N	2026-07-14 12:26:27.924784+05:45
15f6ad69-857a-41e9-b621-d69ee3c2e7a5	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 12:26:31.607857+05:45
ef815672-ede9-4c52-b046-dd611fc71c70	11e156f0-797c-41c2-8322-5603e60a5fd8	LOGOUT	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 12:26:45.329842+05:45
6d18bb3b-107d-4bc5-9bcf-3d33ba6ed43a	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_CREATED	consents	bdd0acfd-0f3a-46a8-892d-f513fa17ead7	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 12:26:56.781999+05:45
adae6236-0f43-4610-a32b-a484ee291e03	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	bdd0acfd-0f3a-46a8-892d-f513fa17ead7	\N	\N	\N	2026-07-14 12:26:56.79153+05:45
953eb6f5-9b94-4f2f-a1d4-7e39ad6eecb7	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	bdd0acfd-0f3a-46a8-892d-f513fa17ead7	\N	\N	\N	2026-07-14 12:26:56.799221+05:45
6bb8452c-c970-49aa-b0d4-bf3c0ca19e8e	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 12:27:00.484548+05:45
fced448d-c153-4994-adc0-06e4539ac4b8	11e156f0-797c-41c2-8322-5603e60a5fd8	LOGOUT	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 12:29:24.203717+05:45
237c87d9-fc68-4f42-9b7d-1be47c8a21c0	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_CREATED	consents	dd009934-ecd3-4f07-a565-9fb009746ca6	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 12:31:11.644081+05:45
12e960e2-0a30-472e-812b-df180f88da00	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	dd009934-ecd3-4f07-a565-9fb009746ca6	\N	\N	\N	2026-07-14 12:31:11.661869+05:45
5720d932-3a36-4658-a7b8-c64f26c70f48	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	dd009934-ecd3-4f07-a565-9fb009746ca6	\N	\N	\N	2026-07-14 12:31:11.673526+05:45
81f391c5-951a-4665-9ee1-bec1fe1260ad	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 12:31:15.907225+05:45
b7d17d1e-2923-4b43-b723-360cb6eb15b8	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 12:36:02.60866+05:45
87ca2faa-e536-47aa-9687-6b82195b846f	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 12:37:11.59009+05:45
89ac4a43-aaf3-400a-a487-3f4f72e9326e	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	bac6e591-f118-4c63-965d-5d112a79571d	\N	\N	\N	2026-07-14 12:38:37.799991+05:45
b8566ba0-4cca-4468-a546-f1bb08461343	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	bac6e591-f118-4c63-965d-5d112a79571d	\N	\N	\N	2026-07-14 12:38:37.856704+05:45
016f8d9f-4796-4ac8-ae22-cd9ba2e2157b	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 12:38:47.864878+05:45
1e7919c0-d3a4-4b1d-b65a-d91c0c09e7b2	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	09426eb2-9a2b-4bb2-9828-e17abc024c6e	\N	\N	\N	2026-07-14 12:40:01.855364+05:45
acbd4b35-8eb3-41db-97fd-bddfea0c7443	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	09426eb2-9a2b-4bb2-9828-e17abc024c6e	\N	\N	\N	2026-07-14 12:40:01.90955+05:45
d32a3480-ac3c-4e98-b479-eb8c81875dae	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 12:41:08.388868+05:45
c34ae7e0-8c74-4c3d-b2ad-3591e2abfb1e	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 12:42:17.821671+05:45
69caa62b-0dc5-4899-99c1-9212995ce6b4	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 12:42:51.799255+05:45
840de996-096e-44e2-89cd-730532ca5d90	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	c1f95db7-8bc6-474d-9ef4-c147c5acdc04	\N	\N	\N	2026-07-14 12:43:34.754979+05:45
b3ffd172-366e-498a-b893-219183a92c16	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	c1f95db7-8bc6-474d-9ef4-c147c5acdc04	\N	\N	\N	2026-07-14 12:43:34.787823+05:45
95993e52-f8cf-4f54-9123-e31d5f85ebad	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	275b71dc-14d2-4a85-8ba3-bd8b8e2a5048	\N	\N	\N	2026-07-14 12:43:34.790717+05:45
bdc50ba7-f8df-4a25-99e6-0cc957a2cc95	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	275b71dc-14d2-4a85-8ba3-bd8b8e2a5048	\N	\N	\N	2026-07-14 12:43:34.805232+05:45
400d3aa8-7735-4615-a635-c736051955ad	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	8a1290ed-3eac-4824-8b23-a7c84470bf10	\N	\N	\N	2026-07-14 12:43:34.807617+05:45
20407152-8954-4347-b71e-faf83c3973ae	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	8a1290ed-3eac-4824-8b23-a7c84470bf10	\N	\N	\N	2026-07-14 12:43:34.823048+05:45
1f4d6a20-7523-4808-9f63-ce3b8d7b19d9	ffc2e870-3525-4af6-b043-28b7d427522e	CONSENT_APPROVED	consents	9191b265-6f7f-4abc-855e-1bf807e9c30c	\N	\N	\N	2026-07-14 12:43:34.825609+05:45
1eaac58c-0cca-44a8-9b91-90c82589b51d	ffc2e870-3525-4af6-b043-28b7d427522e	DATA_FETCHED	asset_snapshots	9191b265-6f7f-4abc-855e-1bf807e9c30c	\N	\N	\N	2026-07-14 12:43:34.846312+05:45
7ac23ad4-f3fa-4c41-bfee-45bee5716f43	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	9d7b8e16-207d-4a32-afb8-a32d43bd559c	\N	\N	\N	2026-07-14 12:43:34.848908+05:45
5150fad6-a0bc-4cd8-9316-d550a4b0d9e7	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	9d7b8e16-207d-4a32-afb8-a32d43bd559c	\N	\N	\N	2026-07-14 12:43:34.867433+05:45
ff0d79c8-9f12-465c-8af4-fd04142625b3	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	7d696d06-1922-4477-b51e-5bad1061c377	\N	\N	\N	2026-07-14 12:43:34.870065+05:45
11e7d4e9-131b-4b6c-adce-ceb9d3417934	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	7d696d06-1922-4477-b51e-5bad1061c377	\N	\N	\N	2026-07-14 12:43:34.8864+05:45
c5c52bf8-afb9-411c-a90c-e9e0491663de	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	1e16849d-faaa-4ad0-8163-6df293edd942	\N	\N	\N	2026-07-14 12:43:34.888958+05:45
7e808864-9a68-47dd-aca2-0a2acb2b4e21	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	1e16849d-faaa-4ad0-8163-6df293edd942	\N	\N	\N	2026-07-14 12:43:34.90953+05:45
d35d2930-fe99-44ee-a8f3-f42d7ee780d9	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	ff0c68d0-4349-40ae-a842-1697cf2312d6	\N	\N	\N	2026-07-14 12:43:34.912291+05:45
93c2000c-6dc1-4256-8491-d2e9008fc7b1	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	ff0c68d0-4349-40ae-a842-1697cf2312d6	\N	\N	\N	2026-07-14 12:43:34.927313+05:45
b4b8b4c1-aceb-4677-aa9a-0004a45ea3f1	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	7cea6840-942b-4153-a63b-20c0a77099d6	\N	\N	\N	2026-07-14 12:43:34.929534+05:45
b9e723b8-acdd-43cc-8542-b11eb74ffb49	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	7cea6840-942b-4153-a63b-20c0a77099d6	\N	\N	\N	2026-07-14 12:43:34.948896+05:45
17621637-6290-4b24-b982-ee1067c852fc	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	72004646-6a57-4314-8238-ef1381a81a09	\N	\N	\N	2026-07-14 12:43:34.951605+05:45
fd350173-d72f-4b5d-aaa5-004e3d604d50	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	72004646-6a57-4314-8238-ef1381a81a09	\N	\N	\N	2026-07-14 12:43:34.96816+05:45
27e80209-973c-40dc-86a4-5d92136c6e62	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	e99c74dd-4e79-45ec-ade0-770c46f4105b	\N	\N	\N	2026-07-14 12:43:34.970919+05:45
c02817da-9b8f-41d9-9b22-8f2288b77192	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	e99c74dd-4e79-45ec-ade0-770c46f4105b	\N	\N	\N	2026-07-14 12:43:34.987395+05:45
9e69cdce-9d34-4470-be36-49a81f1c57f5	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	f8839b54-6176-4c54-9ba7-5e1a8d698341	\N	\N	\N	2026-07-14 12:43:34.98971+05:45
e378f7cf-5987-47cb-9fb0-293a9a4053ba	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	f8839b54-6176-4c54-9ba7-5e1a8d698341	\N	\N	\N	2026-07-14 12:43:35.004055+05:45
a08167b7-a055-4de7-936c-d829423acef0	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	c0c866e6-57cf-467d-83c2-a5545fe7d726	\N	\N	\N	2026-07-14 12:43:35.006648+05:45
e848fa7c-3f8e-434f-b8db-46a8e0ab961b	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	c0c866e6-57cf-467d-83c2-a5545fe7d726	\N	\N	\N	2026-07-14 12:43:35.021076+05:45
5301570e-9264-4118-81e3-26c8277427db	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	e8ab72c4-9646-492f-9df8-cf1bad4ed34b	\N	\N	\N	2026-07-14 12:43:35.022963+05:45
44145afe-820d-4a14-9f43-9c471db6dd7b	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	e8ab72c4-9646-492f-9df8-cf1bad4ed34b	\N	\N	\N	2026-07-14 12:43:35.037652+05:45
e866ef48-c237-482e-b59f-3618514b92ad	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	00397b6b-e38f-4bba-90d6-de520b5c2f01	\N	\N	\N	2026-07-14 12:43:35.04081+05:45
3d1671e4-44e5-4411-9622-47db1d00815a	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	00397b6b-e38f-4bba-90d6-de520b5c2f01	\N	\N	\N	2026-07-14 12:43:35.055084+05:45
7361bfd5-0739-443d-9e53-0f4dcd805da2	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	32b4a534-50f1-4d8c-b94b-a711c8451b59	\N	\N	\N	2026-07-14 12:43:35.05718+05:45
75216b49-c6af-443d-bc17-bcabc9b57194	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	32b4a534-50f1-4d8c-b94b-a711c8451b59	\N	\N	\N	2026-07-14 12:43:35.073251+05:45
2ff1a3e7-7b12-45bd-bc58-093f480fa285	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	89558a7d-70f1-4bf5-b3fc-207d2f66a001	\N	\N	\N	2026-07-14 12:43:35.075805+05:45
0fb8d68e-b45a-467b-be26-d979ac3d6a56	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	89558a7d-70f1-4bf5-b3fc-207d2f66a001	\N	\N	\N	2026-07-14 12:43:35.089645+05:45
21344a63-5789-46ca-ba07-5c65fb0f43dd	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	76d25c18-aaac-489a-a027-80102353085c	\N	\N	\N	2026-07-14 12:43:35.09168+05:45
33a9b8e6-2d29-4fda-8cac-3ff3d6080e73	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	76d25c18-aaac-489a-a027-80102353085c	\N	\N	\N	2026-07-14 12:43:35.106219+05:45
3d90b59e-8d31-4211-94ab-d9cfa1c9122f	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	4e74a5fb-7f43-4001-8fb8-fbc24cd39f21	\N	\N	\N	2026-07-14 12:43:35.10828+05:45
2ad20c47-1174-4e27-a1c3-72edee01182c	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	4e74a5fb-7f43-4001-8fb8-fbc24cd39f21	\N	\N	\N	2026-07-14 12:43:35.1225+05:45
2f7991c1-08e2-4e92-8b7d-2389ac836f66	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	96155f45-4c9c-4b52-820c-830b53d6286a	\N	\N	\N	2026-07-14 12:43:35.124752+05:45
cddefcc8-81dc-4165-b12a-88a11e393e5c	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	96155f45-4c9c-4b52-820c-830b53d6286a	\N	\N	\N	2026-07-14 12:43:35.139364+05:45
646e3a50-3239-425c-8eec-1956842ff9ed	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	e48e8956-637e-49a6-8f2b-47aa86dc37f9	\N	\N	\N	2026-07-14 12:43:35.141573+05:45
8a7ba86e-3056-4e23-84a0-3fbb9751644b	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	e48e8956-637e-49a6-8f2b-47aa86dc37f9	\N	\N	\N	2026-07-14 12:43:35.158382+05:45
c94dc13b-946f-4a39-85d0-78f411d1c155	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	bdd0acfd-0f3a-46a8-892d-f513fa17ead7	\N	\N	\N	2026-07-14 12:43:35.160354+05:45
b630b749-ada0-47d5-8112-5ea5fbfd86c9	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	bdd0acfd-0f3a-46a8-892d-f513fa17ead7	\N	\N	\N	2026-07-14 12:43:35.180646+05:45
ead19114-97fe-4298-b71c-d407a4fd9da1	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	dd009934-ecd3-4f07-a565-9fb009746ca6	\N	\N	\N	2026-07-14 12:43:35.18293+05:45
30a784b4-0d3f-4195-a06e-35af603baee7	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	dd009934-ecd3-4f07-a565-9fb009746ca6	\N	\N	\N	2026-07-14 12:43:35.201701+05:45
68adfb57-65c6-4a98-8e69-e4cee5d085f9	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	bac6e591-f118-4c63-965d-5d112a79571d	\N	\N	\N	2026-07-14 12:43:35.203881+05:45
b8764f80-16f1-4b10-b032-97c0195fcc50	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	bac6e591-f118-4c63-965d-5d112a79571d	\N	\N	\N	2026-07-14 12:43:35.218795+05:45
4584268a-9f86-41c3-9a2b-fb0cc8ab230e	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	09426eb2-9a2b-4bb2-9828-e17abc024c6e	\N	\N	\N	2026-07-14 12:43:35.221049+05:45
1d2fd99c-9f00-4086-b00e-544cef412601	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	09426eb2-9a2b-4bb2-9828-e17abc024c6e	\N	\N	\N	2026-07-14 12:43:35.236487+05:45
b6c61e98-fa75-4a02-9ece-70d012e246c4	11e156f0-797c-41c2-8322-5603e60a5fd8	LOGOUT	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 12:44:31.522197+05:45
a9f3d492-6cd4-4e0b-ac54-4b374d4b791f	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	c1f95db7-8bc6-474d-9ef4-c147c5acdc04	\N	\N	\N	2026-07-14 13:02:37.03302+05:45
a742e60c-da96-42b7-8883-26d5bce31065	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	c1f95db7-8bc6-474d-9ef4-c147c5acdc04	\N	\N	\N	2026-07-14 13:02:37.104211+05:45
f2abc472-a36c-428b-9a79-32788af27dd6	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	275b71dc-14d2-4a85-8ba3-bd8b8e2a5048	\N	\N	\N	2026-07-14 13:02:37.107732+05:45
99a31ce1-7bd4-49f9-b704-10bd0d7e0768	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	275b71dc-14d2-4a85-8ba3-bd8b8e2a5048	\N	\N	\N	2026-07-14 13:02:37.128539+05:45
5fa8808d-7264-479f-bb37-b50630d3df3b	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	8a1290ed-3eac-4824-8b23-a7c84470bf10	\N	\N	\N	2026-07-14 13:02:37.131136+05:45
1f5368bd-0372-43ef-8484-1d1148b6bb2a	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	8a1290ed-3eac-4824-8b23-a7c84470bf10	\N	\N	\N	2026-07-14 13:02:37.149678+05:45
2ba61244-ec44-40f7-99f0-afba2c494310	ffc2e870-3525-4af6-b043-28b7d427522e	CONSENT_APPROVED	consents	9191b265-6f7f-4abc-855e-1bf807e9c30c	\N	\N	\N	2026-07-14 13:02:37.152381+05:45
490a7521-2631-4eda-b2ad-cb024bb8121c	ffc2e870-3525-4af6-b043-28b7d427522e	DATA_FETCHED	asset_snapshots	9191b265-6f7f-4abc-855e-1bf807e9c30c	\N	\N	\N	2026-07-14 13:02:37.170308+05:45
49e5798e-e37b-4d7f-b180-725781575600	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	9d7b8e16-207d-4a32-afb8-a32d43bd559c	\N	\N	\N	2026-07-14 13:02:37.172758+05:45
430847a8-35e2-4b18-8af1-fa16a8dbb574	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	9d7b8e16-207d-4a32-afb8-a32d43bd559c	\N	\N	\N	2026-07-14 13:02:37.191909+05:45
6c6e83c5-26c4-447a-b34b-ae8073486c29	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	7d696d06-1922-4477-b51e-5bad1061c377	\N	\N	\N	2026-07-14 13:02:37.194559+05:45
b235fe99-96bb-46ef-bcb8-38eaf7e9d04f	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	e8ab72c4-9646-492f-9df8-cf1bad4ed34b	\N	\N	\N	2026-07-14 13:02:37.383723+05:45
3491f45e-0a9e-44ec-b806-2df309d5ec44	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	e8ab72c4-9646-492f-9df8-cf1bad4ed34b	\N	\N	\N	2026-07-14 13:02:37.408069+05:45
2a53ea8e-8588-440a-ac56-666f38d37303	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	00397b6b-e38f-4bba-90d6-de520b5c2f01	\N	\N	\N	2026-07-14 13:02:37.410427+05:45
12276ce0-e2b2-464d-8812-c3d5d18fc1b0	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	00397b6b-e38f-4bba-90d6-de520b5c2f01	\N	\N	\N	2026-07-14 13:02:37.427227+05:45
4da469d3-01fa-4923-b2a6-5947e797b01a	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	32b4a534-50f1-4d8c-b94b-a711c8451b59	\N	\N	\N	2026-07-14 13:02:37.430177+05:45
fa18c189-664d-464a-8401-590229c3c8ea	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	32b4a534-50f1-4d8c-b94b-a711c8451b59	\N	\N	\N	2026-07-14 13:02:37.446842+05:45
31fbab00-c510-429e-9203-a50987f64e99	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	89558a7d-70f1-4bf5-b3fc-207d2f66a001	\N	\N	\N	2026-07-14 13:02:37.45032+05:45
80c95bb7-2c0b-4fc0-a860-17c2e21b41a5	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	89558a7d-70f1-4bf5-b3fc-207d2f66a001	\N	\N	\N	2026-07-14 13:02:37.466966+05:45
a3840110-6754-4373-925e-3b99c18ac01b	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	76d25c18-aaac-489a-a027-80102353085c	\N	\N	\N	2026-07-14 13:02:37.469276+05:45
35094b8f-f044-4047-9c2f-d5bd1f8baa4d	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	76d25c18-aaac-489a-a027-80102353085c	\N	\N	\N	2026-07-14 13:02:37.486622+05:45
d935891a-a350-437f-a717-3107f5420962	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	4e74a5fb-7f43-4001-8fb8-fbc24cd39f21	\N	\N	\N	2026-07-14 13:02:37.488987+05:45
cfde8e5d-5d47-4a76-9782-f8360416b840	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	4e74a5fb-7f43-4001-8fb8-fbc24cd39f21	\N	\N	\N	2026-07-14 13:02:37.506076+05:45
6c53517f-1e12-43b0-a14c-7d3db11b00fe	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	96155f45-4c9c-4b52-820c-830b53d6286a	\N	\N	\N	2026-07-14 13:02:37.508894+05:45
5bd55fd1-6ded-4b14-a810-f63cc8b28f0d	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	96155f45-4c9c-4b52-820c-830b53d6286a	\N	\N	\N	2026-07-14 13:02:37.517767+05:45
a094f2ae-677b-4da9-9c8d-a834ef28d6cf	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	e48e8956-637e-49a6-8f2b-47aa86dc37f9	\N	\N	\N	2026-07-14 13:02:37.520141+05:45
8a62031b-9aa2-4f2d-a742-1b0a4f9077cd	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	e48e8956-637e-49a6-8f2b-47aa86dc37f9	\N	\N	\N	2026-07-14 13:02:37.536591+05:45
22c4ba77-d243-46f5-8877-f838db792ee6	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	bdd0acfd-0f3a-46a8-892d-f513fa17ead7	\N	\N	\N	2026-07-14 13:02:37.53922+05:45
b08083f5-619a-4c35-b246-983ab6d195ac	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	bdd0acfd-0f3a-46a8-892d-f513fa17ead7	\N	\N	\N	2026-07-14 13:02:37.557108+05:45
2cf82b91-d469-48e9-a5d8-b77d96455e37	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	dd009934-ecd3-4f07-a565-9fb009746ca6	\N	\N	\N	2026-07-14 13:02:37.560346+05:45
d3443404-c483-4b6f-b6b1-97321934823c	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	dd009934-ecd3-4f07-a565-9fb009746ca6	\N	\N	\N	2026-07-14 13:02:37.57767+05:45
a1adb515-9cc6-4dc0-ae19-131e8b5c405c	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	bac6e591-f118-4c63-965d-5d112a79571d	\N	\N	\N	2026-07-14 13:02:37.579996+05:45
c42518e6-e699-4799-a308-a3037f0a7113	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	bac6e591-f118-4c63-965d-5d112a79571d	\N	\N	\N	2026-07-14 13:02:37.597868+05:45
1af2e3a9-ec63-4a39-9d9d-b4814b2242e2	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	09426eb2-9a2b-4bb2-9828-e17abc024c6e	\N	\N	\N	2026-07-14 13:02:37.60063+05:45
36b2adba-22a7-4829-beb3-55ad93a57dbf	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	09426eb2-9a2b-4bb2-9828-e17abc024c6e	\N	\N	\N	2026-07-14 13:02:37.60659+05:45
000f873f-3d82-44dc-acaa-9940bb06223c	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 13:05:49.26487+05:45
20e5c276-ceba-4556-8926-8222823a543d	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_CREATED	consents	18471fa5-6355-40ff-a279-93998766f260	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 13:07:26.475884+05:45
5d31115c-4461-44f2-9d74-572e73872630	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	18471fa5-6355-40ff-a279-93998766f260	\N	\N	\N	2026-07-14 13:07:26.489233+05:45
7fc8e1c9-0c8e-4aff-b41c-369340422c58	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	18471fa5-6355-40ff-a279-93998766f260	\N	\N	\N	2026-07-14 13:07:26.524546+05:45
388ca217-663d-47a8-bfa7-e30b9c4ec72e	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 13:07:30.1688+05:45
ca1768c6-0fcd-423d-a158-7297796e92f7	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 13:11:41.650152+05:45
2087f81e-12e6-4b54-ac77-f282329b34cf	11e156f0-797c-41c2-8322-5603e60a5fd8	LOGOUT	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 13:14:28.67854+05:45
8144e89b-80e2-4bbd-861f-a6c6d4a5c6e1	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_CREATED	consents	cb6fbebc-8c73-44af-92ca-6df3ab30023d	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 13:14:38.789742+05:45
0739bd78-fe3e-4d5d-b68a-0c6559f315de	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	cb6fbebc-8c73-44af-92ca-6df3ab30023d	\N	\N	\N	2026-07-14 13:14:38.803327+05:45
83e5f7a9-aec7-413f-8b79-138fb50ec80b	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	cb6fbebc-8c73-44af-92ca-6df3ab30023d	\N	\N	\N	2026-07-14 13:14:38.837592+05:45
49eee68a-bfbf-4995-afa5-f617b6585e62	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 13:14:42.524059+05:45
43ab0aaa-be8d-4490-acba-057815a8f5e0	11e156f0-797c-41c2-8322-5603e60a5fd8	LOGOUT	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 13:14:47.837546+05:45
15b83e95-7a88-4eac-96e4-6dae3c153130	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_CREATED	consents	9fca033b-6f0b-488e-915f-a0ee9e3f42b2	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 13:15:09.348273+05:45
034590c3-f99a-4cef-995a-3ae803800dca	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	9fca033b-6f0b-488e-915f-a0ee9e3f42b2	\N	\N	\N	2026-07-14 13:15:09.357562+05:45
e459a902-2934-491e-88cc-8592922d0946	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	9fca033b-6f0b-488e-915f-a0ee9e3f42b2	\N	\N	\N	2026-07-14 13:15:09.370691+05:45
9562e23b-49d2-4c6d-aacd-c9445ef8fde4	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 13:15:13.082034+05:45
224e2805-94c4-4772-94b3-c8fa80d8afb3	11e156f0-797c-41c2-8322-5603e60a5fd8	LOGOUT	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 13:15:19.753232+05:45
6c57bb63-f6fb-4395-be29-b11eeaee18cf	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_CREATED	consents	8a22fe6e-d998-4fa1-b396-c73bd42d37e5	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 13:15:27.75051+05:45
e7e0cd1e-390d-406e-8791-c5b77156df09	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	8a22fe6e-d998-4fa1-b396-c73bd42d37e5	\N	\N	\N	2026-07-14 13:15:27.760687+05:45
ecf565a5-c55b-489a-afa9-949b927e56b4	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	8a22fe6e-d998-4fa1-b396-c73bd42d37e5	\N	\N	\N	2026-07-14 13:15:27.772477+05:45
8d3d5132-e3e1-47fb-a027-f563e1abf404	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 13:15:31.467447+05:45
98e80716-b831-40d4-bb2c-0ce2bd12cf22	11e156f0-797c-41c2-8322-5603e60a5fd8	LOGOUT	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 13:16:49.884629+05:45
dd3ee27a-d4e0-4675-8184-23e014ebaa39	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_CREATED	consents	2dd33edf-b742-4e41-8ecc-ad2b77dd8596	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 13:17:00.273064+05:45
7645ce39-f9d4-4204-a7fd-40f0225bb5da	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	2dd33edf-b742-4e41-8ecc-ad2b77dd8596	\N	\N	\N	2026-07-14 13:17:00.28318+05:45
0ce41880-e826-4c95-b574-a95c9236ac41	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	2dd33edf-b742-4e41-8ecc-ad2b77dd8596	\N	\N	\N	2026-07-14 13:17:00.297683+05:45
5e0c90d4-9b35-4d53-be4e-72ab6dd2dedb	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 13:17:03.967239+05:45
7908897a-b00b-4c18-9f34-56d692cad792	11e156f0-797c-41c2-8322-5603e60a5fd8	LOGOUT	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 13:17:26.424327+05:45
280b4594-ed8c-4a58-a2b0-2d0af89ea1da	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_CREATED	consents	b1641570-8830-4b3a-b445-919f0e07a1c0	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 13:17:36.946887+05:45
cdd2a8f4-f0ba-4384-a862-f7b8adb542bd	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	b1641570-8830-4b3a-b445-919f0e07a1c0	\N	\N	\N	2026-07-14 13:17:36.957064+05:45
0e8252b7-dc84-487c-b854-ed5d9ddb8ba4	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	b1641570-8830-4b3a-b445-919f0e07a1c0	\N	\N	\N	2026-07-14 13:17:36.970243+05:45
e6987155-9192-4047-9200-e57f4ba8c24f	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 13:17:40.631773+05:45
1549fc84-c9f1-4711-a519-3e650fd5aabf	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 13:21:23.595904+05:45
fd8e53d3-e259-45a2-85c6-76122fb1d02b	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_CREATED	consents	250a6539-a80d-4e10-8ed2-436529a63d98	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 13:27:25.87386+05:45
34326649-297f-44e9-bc7d-fbec2ab0bd67	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	250a6539-a80d-4e10-8ed2-436529a63d98	\N	\N	\N	2026-07-14 13:27:25.891426+05:45
c64d08a3-fb5c-4d73-8d91-cac5244cc831	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	250a6539-a80d-4e10-8ed2-436529a63d98	\N	\N	\N	2026-07-14 13:27:25.920134+05:45
af317104-0388-4322-9f90-950d13563101	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 13:27:43.082798+05:45
04041531-0b16-4eb0-85f8-cf594ec631a0	11e156f0-797c-41c2-8322-5603e60a5fd8	LOGOUT	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 13:27:51.683832+05:45
aff7d8d0-ebdf-477e-a742-0aea8b6bc6f6	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_CREATED	consents	d962373b-7bb7-4fc1-82ae-645d37d46919	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 13:28:03.663863+05:45
7323577c-eb20-4f62-b89a-17da9fc84f6c	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	d962373b-7bb7-4fc1-82ae-645d37d46919	\N	\N	\N	2026-07-14 13:28:03.673504+05:45
b8390221-ae75-412b-a890-582a222d2f94	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	d962373b-7bb7-4fc1-82ae-645d37d46919	\N	\N	\N	2026-07-14 13:28:03.696277+05:45
c9bd43aa-ac5d-451d-b74c-0a5f96a6f97d	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 13:28:08.070488+05:45
f0763aee-40a6-4d13-a8ba-10c3bdd508fd	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_CREATED	consents	c4acca52-4593-420c-b813-171d50050c83	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 13:28:27.572674+05:45
01325740-67c1-4edb-8997-a1ef992b4509	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	c4acca52-4593-420c-b813-171d50050c83	\N	\N	\N	2026-07-14 13:28:27.583222+05:45
3764fb6a-85a6-4980-b02d-57dfa925297c	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	c4acca52-4593-420c-b813-171d50050c83	\N	\N	\N	2026-07-14 13:28:27.604213+05:45
919be77a-1eb3-44be-9efd-a89d56836c2e	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_CREATED	consents	eea501e2-9a8a-4e37-a3ba-9ae6a8bc5c69	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 13:29:34.874653+05:45
8e7a34dc-2c2a-4623-b66a-318375d1029f	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	eea501e2-9a8a-4e37-a3ba-9ae6a8bc5c69	\N	\N	\N	2026-07-14 13:29:34.88574+05:45
f91dbd05-7ca2-4f71-baad-130853ebfcee	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	eea501e2-9a8a-4e37-a3ba-9ae6a8bc5c69	\N	\N	\N	2026-07-14 13:29:34.908059+05:45
69282d91-40d1-4c99-a00f-2c2264e9a451	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_CREATED	consents	d1677bb0-f8aa-4a8b-ad36-436d67dcaca1	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 13:29:50.660784+05:45
1d6f5288-d587-469b-a595-5e4e1893bddc	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	d1677bb0-f8aa-4a8b-ad36-436d67dcaca1	\N	\N	\N	2026-07-14 13:29:50.670266+05:45
4a7122a1-1e73-4695-9c15-109c9ee7fe20	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	d1677bb0-f8aa-4a8b-ad36-436d67dcaca1	\N	\N	\N	2026-07-14 13:29:50.688392+05:45
c46a45bb-80b2-4c0a-926c-449e7c0eb0a6	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_CREATED	consents	f52b1548-693a-4285-a82f-69e56a6ab841	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 13:31:19.173394+05:45
7be7a64d-fbc3-4097-9844-d80a54a28594	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	f52b1548-693a-4285-a82f-69e56a6ab841	\N	\N	\N	2026-07-14 13:31:19.184614+05:45
f43e4fc7-84c5-44e7-b14f-8644b5af0416	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	f52b1548-693a-4285-a82f-69e56a6ab841	\N	\N	\N	2026-07-14 13:31:19.205953+05:45
b9f05c90-2ead-4c4b-91e3-9f30b13af033	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 13:33:11.669355+05:45
4f589a49-876c-4c29-a34f-839d1cf8c81c	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 13:46:28.828935+05:45
d12fbf2c-d170-4c36-b2a0-df93ff27fa7f	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 19:58:09.398598+05:45
8090f5ea-677c-4d3d-9161-0f5c4db97eb7	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_CREATED	consents	b777e6a5-d4fc-4ff6-bb64-d9f64edc5c30	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 19:58:23.33843+05:45
0068e138-cf97-4dda-b936-66742cf935c6	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	b777e6a5-d4fc-4ff6-bb64-d9f64edc5c30	\N	\N	\N	2026-07-14 19:58:23.354267+05:45
724b114e-4934-4158-b0e7-c4f34553f059	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	b777e6a5-d4fc-4ff6-bb64-d9f64edc5c30	\N	\N	\N	2026-07-14 19:58:23.400327+05:45
a6943613-3502-4398-addf-17fa1111c50f	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 19:58:27.815609+05:45
73874436-f504-4881-8364-c14f2d16fc50	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 20:13:31.4957+05:45
e0d72665-12a8-44e4-82d0-d6a4132ea456	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 20:29:26.73913+05:45
48a7c621-03a1-4f62-82a0-ff08e5f19bda	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 20:29:30.317822+05:45
a2a72144-65fc-44f1-9ba3-1be1276eac28	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 20:32:04.831685+05:45
d61c9918-a26c-4266-b12f-484aa6811513	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 20:41:25.435835+05:45
2789eccb-6625-4c4c-b87b-bdea329f76dc	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 20:42:14.438415+05:45
43ba4039-81a0-47fc-ab56-d35d98184226	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 20:42:54.302359+05:45
6cd78573-d911-4028-91a9-d46e11fc6f21	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 20:43:35.741053+05:45
4b26ad44-c15e-4671-bf09-aa02d83fa7dc	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 20:43:49.700944+05:45
0088bfeb-1a9a-43da-a217-432d2a21ea29	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 20:44:30.55202+05:45
9eb4c54b-ca53-4fee-9fd5-b3c1e2beaab0	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 20:44:34.98373+05:45
7eae4077-999d-4467-a64f-f01584df8565	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 20:45:24.559133+05:45
7638949e-ba71-4a9b-9bf6-d3bd94616d90	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 20:45:27.770865+05:45
adf5b791-df78-4499-8a9c-7fb6d8854647	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 20:45:32.215823+05:45
65757945-f5bc-4d29-9b98-18ac3d0a71f4	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 20:50:33.030067+05:45
5e7dcacf-b9d8-4607-95fc-b8ee1d152fbf	bdf2c995-d666-4323-83b9-d5005771f08f	LOGIN	users	bdf2c995-d666-4323-83b9-d5005771f08f	127.0.0.1	Audit-Test-Agent/1.0	{"method": "phone_otp"}	2026-08-23 01:14:34.652669+05:45
5e27699f-bb42-4eec-81aa-0a9f77b71847	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 20:52:07.213099+05:45
84a49805-5d30-412d-9aaa-a2c3d37a041a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 20:52:41.103992+05:45
a10790f2-fc71-4f16-a2bb-0dfc4519b961	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 20:55:46.621969+05:45
59646d48-3abc-45e0-8167-3ec3767beca7	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 20:59:05.343327+05:45
1292ea87-a3e8-4330-ac76-3b41409d9fcc	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 21:01:18.515437+05:45
a81b65ce-b925-4477-91e2-3a3232da1dd6	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 22:47:40.796305+05:45
0bb1479e-77dd-42f1-8a70-3c568960da32	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 22:47:40.990489+05:45
213b5a53-441e-489f-8636-263213f55739	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_CREATED	consents	b79ed267-d972-49ff-a5e3-1dc399465827	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 22:47:56.144511+05:45
7e166719-16a4-4643-9d6f-f2e94d6d82ee	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	b79ed267-d972-49ff-a5e3-1dc399465827	\N	\N	\N	2026-07-14 22:47:56.20196+05:45
56b9baea-a4c8-416a-a583-318c89b14ac5	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	b79ed267-d972-49ff-a5e3-1dc399465827	\N	\N	\N	2026-07-14 22:47:56.304011+05:45
8d3878d0-4ed5-466f-8fd2-e555dd8f372b	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 22:48:00.747584+05:45
c1929570-4ee3-4089-9ad0-3ac8e6b2a5a4	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 22:51:07.796962+05:45
b7894c1e-06a6-41c4-87ef-8368ca96243c	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 22:51:24.229037+05:45
260e1eed-3777-421b-9b6b-6cd87ae07b09	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 22:51:34.08827+05:45
cd821756-f0d5-4319-8ae6-1e7f702dcb26	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 22:51:42.042628+05:45
d5fbecfd-39db-4c52-86f1-1e7f352235fe	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 22:51:46.046837+05:45
bbb95d07-aef0-4675-8fff-e7f499462615	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 22:53:25.026018+05:45
8a81144e-15c7-4631-b8ab-86ca6f68ad57	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 23:17:27.890344+05:45
e88a7e82-5a89-4f1d-8c1a-b4c3eceb9605	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 23:17:30.583364+05:45
0c4ec0f8-7fb9-4fcb-ad73-87d5dd6b9710	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-14 23:17:56.64484+05:45
40d4f9b7-2a4a-413f-8f9c-d50fdbf6121a	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_CREATED	consents	e250d029-8428-4a98-9c45-bf42dfd5bc84	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-15 19:10:09.938508+05:45
7c6c14da-a4a8-4966-adb7-28a3cc6354a0	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	e250d029-8428-4a98-9c45-bf42dfd5bc84	\N	\N	\N	2026-07-15 19:10:09.981517+05:45
c961c40a-6e39-43ce-81f9-990e83b5ce05	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	e250d029-8428-4a98-9c45-bf42dfd5bc84	\N	\N	\N	2026-07-15 19:10:10.0192+05:45
0ec3fc45-66ad-4562-99a3-fa0bb4b87909	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-15 19:10:15.140975+05:45
d5b59c49-443e-4ce9-ad7c-2bd06d39c0b7	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-15 19:11:07.637806+05:45
c33335fe-7e39-4086-8d29-bfd4bcbf9329	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-15 19:16:59.666522+05:45
873ef328-d7b9-4642-b21c-b7ed79372fb9	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_CREATED	consents	cd64b8ae-e9e7-414d-aced-3eea92769a83	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-15 19:36:27.477559+05:45
453661ca-5f97-4162-aeca-76bfa68e879d	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	cd64b8ae-e9e7-414d-aced-3eea92769a83	\N	\N	\N	2026-07-15 19:36:27.491327+05:45
c3799790-4191-4460-81f5-253ddf8dc58c	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	cd64b8ae-e9e7-414d-aced-3eea92769a83	\N	\N	\N	2026-07-15 19:36:27.529457+05:45
e2eeae02-e699-4231-a8e4-60f450792c10	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-15 19:36:32.114131+05:45
4430f1ce-e877-489d-a752-8f22a7150d94	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-15 19:36:41.256367+05:45
e5e658f0-1bdd-4fac-82ae-b4aa632fdede	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-16 12:42:14.913939+05:45
d358f962-4f0d-4606-9ac4-54affbbcbbca	0ea53b57-0787-4982-8d23-270b32e4029f	CONSENT_CREATED	consents	5ca7592f-9f60-4b99-af66-1d17122485d3	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-16 12:42:48.384324+05:45
ea9841a9-7735-45b1-8066-2dc1d40ff8fc	0ea53b57-0787-4982-8d23-270b32e4029f	CONSENT_APPROVED	consents	5ca7592f-9f60-4b99-af66-1d17122485d3	\N	\N	\N	2026-07-16 12:42:48.397413+05:45
abd44189-9bc8-44af-a17d-ac8069282654	0ea53b57-0787-4982-8d23-270b32e4029f	DATA_FETCHED	asset_snapshots	5ca7592f-9f60-4b99-af66-1d17122485d3	\N	\N	\N	2026-07-16 12:42:48.437131+05:45
11e09329-bfeb-4318-a4e3-d41622b19a8e	0ea53b57-0787-4982-8d23-270b32e4029f	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-16 12:42:52.566752+05:45
86655f84-2378-48e9-a17b-29ad5294cd74	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_CREATED	consents	5b77453d-4ffa-4121-8eaf-259480a76f23	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-16 12:44:15.834839+05:45
571c43c0-7c08-46b9-bf68-03a69756b31b	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	5b77453d-4ffa-4121-8eaf-259480a76f23	\N	\N	\N	2026-07-16 12:44:15.845841+05:45
6027e3f4-b88b-431b-8215-0f4a45343855	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	5b77453d-4ffa-4121-8eaf-259480a76f23	\N	\N	\N	2026-07-16 12:44:15.87021+05:45
7a8c7890-a6e2-4268-8afc-462440a577a5	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-16 12:44:19.539989+05:45
7ad483d6-f284-4881-a282-54c29141aff0	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_CREATED	consents	8ad76b90-5613-4a99-b453-040796bc873a	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-16 12:45:43.056752+05:45
19db1716-f1b2-42db-bf23-6d1f82ad843e	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	8ad76b90-5613-4a99-b453-040796bc873a	\N	\N	\N	2026-07-16 12:45:43.065407+05:45
ee9df0ed-fe85-4c1f-a403-86d39bef1d9e	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	8ad76b90-5613-4a99-b453-040796bc873a	\N	\N	\N	2026-07-16 12:45:43.085985+05:45
676264e4-0a2a-43fc-8edc-74f89080e8dd	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-16 12:45:46.959979+05:45
cca0c33e-f52d-40d0-9281-1a4973c3e256	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_CREATED	consents	66a57f1c-f5b8-4ee1-bb7c-2a8d7bc1f38e	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-16 12:49:22.729903+05:45
edf3bfce-d1d9-424b-bb37-f6e8fb30f419	11e156f0-797c-41c2-8322-5603e60a5fd8	CONSENT_APPROVED	consents	66a57f1c-f5b8-4ee1-bb7c-2a8d7bc1f38e	\N	\N	\N	2026-07-16 12:49:22.750449+05:45
66e6e409-e8ee-4ae5-ba85-d4ccb58944fd	11e156f0-797c-41c2-8322-5603e60a5fd8	DATA_FETCHED	asset_snapshots	66a57f1c-f5b8-4ee1-bb7c-2a8d7bc1f38e	\N	\N	\N	2026-07-16 12:49:22.808047+05:45
49eb0913-03d6-42bc-b639-153dad47f637	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-16 12:49:26.805153+05:45
f14fa64a-624f-4ce0-ba32-faf8b34a293f	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-16 13:09:32.10433+05:45
475a1f2e-7ac8-4762-a754-1e94bf10caa5	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-16 13:36:09.329485+05:45
880494a2-eb75-4751-9766-c201538b3a1c	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-16 13:36:11.570657+05:45
e1053416-e924-47ce-be0f-a6f532a23734	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-16 14:01:01.24233+05:45
ef1f6ac9-5a54-43ec-8a95-e918dade011a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-16 14:10:48.702602+05:45
b05a5e4f-12f8-452a-8b0f-a21fba6c0d27	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-16 14:11:00.764667+05:45
d81c51ed-300a-438f-abfb-e2f86bfcd788	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-16 14:11:38.57909+05:45
f4529d36-e851-4b16-8880-f5dd95002d0d	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-16 14:14:11.59036+05:45
aa971a50-ff87-485a-8ef9-2b2a5857cdcf	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-16 14:14:33.507749+05:45
6008bbe5-f44e-4b7c-9347-743097b3f81a	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-16 14:17:58.905046+05:45
caa39053-1dda-401a-9172-cdfb0ab3a50c	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-16 14:23:33.167475+05:45
e6c9fdf9-da88-44bc-a80d-fe7eb1f51833	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-16 14:24:47.921903+05:45
a91b2638-bc88-4dc4-b75a-75b214d5ec15	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-16 14:24:59.080657+05:45
69f68afc-1823-474f-8285-df65b31209a3	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-16 14:35:13.002897+05:45
6f1f5f37-e4e3-4ae9-abbc-08c8b01d7ed3	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-16 14:39:55.25626+05:45
f0fdc1f2-dac3-4622-a194-5614b934d531	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-16 14:59:26.276448+05:45
d79e714b-f11b-4f22-ba3a-72d656110502	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-16 14:59:32.656795+05:45
1ee93083-1768-444a-8825-fb51cae97701	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-16 19:49:02.879508+05:45
e42d3b6b-501d-45c1-8550-a670fb80fd0f	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-16 20:15:44.968654+05:45
53707b52-7749-4d66-9d9e-92b836620f51	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-16 20:15:45.122409+05:45
a3ad4d9a-8ae7-4410-8a2e-fac4ea19f6f7	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-16 20:15:45.258332+05:45
16340933-6add-4d9d-8b70-3f4a40aa6aec	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-16 20:15:47.52855+05:45
5a6e3013-2d4b-4c68-a131-57b1cab71d40	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-16 20:28:17.613715+05:45
dacd8cc1-1a72-4ac2-b82e-42bde83675f8	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-16 20:30:29.771542+05:45
60f9b790-63fe-499f-b3f5-1294d8c81d4b	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-16 20:30:50.245819+05:45
23d7c619-fd07-44b2-b011-79ba77d14a84	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-16 21:47:09.79365+05:45
868a2341-79b4-44fa-9d6a-058ab6e2a364	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-16 21:47:14.958258+05:45
bfc1041e-2ab3-4502-a76a-32451f30b5a5	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	2026-07-16 21:50:48.123024+05:45
7f60c4c8-b77b-4ef1-a5d8-997a4759ba08	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-17 09:30:43.940009+05:45
e259368f-238f-4a00-a13b-6aaa829a83af	11e156f0-797c-41c2-8322-5603e60a5fd8	LOGOUT	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-17 09:30:46.811005+05:45
11636aa5-06cf-4376-a96b-0cf32a8a3beb	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-17 09:30:59.944373+05:45
4f7368ec-0136-4ad0-9da5-d91e71357d31	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-17 13:46:38.794317+05:45
89b89fd2-1bf1-4363-8d74-1ea13dae10ed	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-17 13:46:45.558496+05:45
525a118f-1622-481e-a3d1-63ef64014b60	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-17 14:08:41.474852+05:45
29dae2d4-51da-46f1-a4d5-3e3bebf3023b	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-17 14:25:32.569725+05:45
c92aeda9-d02b-45af-acfc-d8744919b22a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-17 14:26:41.614916+05:45
e690214d-9773-4430-ba8b-54b0917a2aed	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-17 14:26:46.489588+05:45
48717bd8-dbe8-4cd3-8180-363b4da79122	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-17 14:27:49.42205+05:45
bfd9fee7-77c2-4ec3-8d26-e2c4d35a8da2	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-17 14:28:55.50437+05:45
c736eb62-a033-4b4c-92e0-5e64dba77120	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-17 14:36:24.107757+05:45
a9eaf6c8-7ad9-41f0-9b86-7efb76486df4	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-17 14:38:29.34057+05:45
f50b5def-2f8f-4a55-ada8-c37dc400c282	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-17 14:38:35.322102+05:45
7800a0b0-6ddc-433a-aefd-f03d75109765	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-17 14:46:04.666952+05:45
288b392a-c799-4e91-99b8-445900e50545	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-17 15:03:24.601364+05:45
38c7e0b9-be93-49d3-9ab8-eddf2a3e76bf	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-17 15:03:27.398092+05:45
502b258e-fe64-4579-8ba0-7ea309e89951	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-17 15:05:35.889904+05:45
c32f1343-3cc0-4701-bd2c-c1b006a7d5f9	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-17 15:12:43.791696+05:45
a0773867-6ad8-4493-8a4a-23c10ccc7aac	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-17 15:21:49.653092+05:45
1e308e21-c4ba-430e-b46c-564fa0e7dce6	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-17 15:21:52.823109+05:45
1769bbc5-1ca6-4ea9-bc11-875ab7feb8e1	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-17 15:23:20.627412+05:45
34a7c407-9290-4f57-9624-7820ae0ea04c	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-19 13:12:57.108935+05:45
c7bab768-301c-4eb6-8978-daa71c8d6c37	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-19 13:14:41.395472+05:45
459cef0b-c3a0-4a99-94fd-dfa2d81ab00d	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-19 13:17:55.337872+05:45
319903f6-2a4e-4483-9f1e-6f3c1c6ffab3	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-19 13:18:30.853343+05:45
7d8dcdb8-6bd4-4b22-8b5b-a44cb807c2c0	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-19 13:18:36.428923+05:45
7b3bacf6-7362-41c0-88a7-79e47aa965bc	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-19 13:18:40.70448+05:45
7a4bf1db-3b2d-44e6-bae1-d1f2a2fa66d1	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-19 13:18:46.740663+05:45
425a7ba0-796f-468d-91ae-f86a8a100548	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-19 13:18:50.874528+05:45
a54e1e4c-78f4-40a7-b5a9-2cbe77284d66	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-19 13:39:02.776363+05:45
ac0b0871-58fe-4bc1-a092-09d9b9c5ce6d	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-19 13:45:58.90121+05:45
6a7b111f-179a-4bcb-9103-88a16c088572	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-19 14:16:49.887923+05:45
5728f7af-ce3c-4d0a-b6fa-14fc68bfc77d	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-19 14:53:50.676505+05:45
1499a2cf-d77a-48af-b816-60cb2fc98490	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-19 15:04:09.17742+05:45
ce8d0875-7142-47a7-bddd-cfd74ab084d6	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-19 15:06:37.164986+05:45
d698c729-6ace-48f1-850a-c4f009925534	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-19 15:09:53.026684+05:45
04a618e7-ffb7-4074-9008-33a33f36f4f9	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-19 15:25:02.224324+05:45
9be9f279-50cc-4ba7-a03b-94d843bc12af	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-20 14:23:01.025329+05:45
10cbc5ac-2187-449b-8f41-5ee69126e01f	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-20 14:23:03.064822+05:45
e7791b74-d723-4a43-9f7f-e18c3e056587	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-20 14:23:29.278756+05:45
971e89ec-98ca-4657-bb13-852d42da3e1b	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-20 14:30:39.651902+05:45
439fdf64-0818-4de0-a205-4dcf3212cd08	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-20 14:55:35.747319+05:45
6f2c7d3f-3f25-4415-a010-3560aaf40e24	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-20 14:55:37.790938+05:45
522af906-b0e4-4bd9-a03c-ed5b2666d2bd	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-20 15:10:47.334726+05:45
fe03d611-e71b-4fa5-b6f4-5d19cbed2069	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-20 15:17:07.089386+05:45
b38519c9-8af0-4e65-8a97-742956fed57a	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-20 15:37:05.097013+05:45
46b38368-c29e-4a76-b0d8-390d6c4d8c7e	bdf2c995-d666-4323-83b9-d5005771f08f	PHONE_VERIFIED	auth	\N	127.0.0.1	\N	\N	2026-08-23 01:14:34.6846+05:45
eca23f60-c519-48f6-89ae-af1f3d6ce1c9	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-20 15:37:06.698181+05:45
8636786b-2925-4a1a-8406-eb92a46ba958	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-20 15:49:52.521184+05:45
b8dc6dd8-8636-46f6-a1fa-e810856a8b27	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 11:30:32.448975+05:45
a9f3c42d-cdde-4bcd-917c-8a020a5f2add	11e156f0-797c-41c2-8322-5603e60a5fd8	LOGOUT	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 11:30:34.572093+05:45
c0cedd6d-0abf-437b-9574-60ff8950fe75	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 11:30:41.061011+05:45
a1e81a3e-0c8f-446e-89e3-db7382006fc8	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 11:37:01.376171+05:45
17daaa43-4680-4bfe-b6c8-bde6f44bcace	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 11:37:10.130417+05:45
b830f652-b883-46e7-9204-4553f539ecf5	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 11:43:51.966996+05:45
b7e98de0-cdf0-48f6-978e-b9a0098b1b08	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 11:44:17.873913+05:45
cab8a767-0ff5-40ac-be60-3594e41b61e8	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 11:48:19.825252+05:45
7e00811b-1c8d-4097-a3e9-9f5ec7b61ca9	11e156f0-797c-41c2-8322-5603e60a5fd8	LOGOUT	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 11:54:42.106723+05:45
b0984a8c-b6a2-402d-a46d-8ac11ece4d3c	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 11:55:45.740904+05:45
7de24f7c-5474-4131-bf7f-47a3e171cf9f	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 12:07:43.881253+05:45
6370ae32-505a-4b23-b7e3-304c92b1a228	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 12:31:48.929658+05:45
9acc83fb-2ce4-4ec5-a61c-6261c4fa2bca	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 12:31:50.731131+05:45
f76fdf0b-beb6-46e0-adea-e57fa4ccf5af	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 12:36:58.834392+05:45
e23139b7-8a7a-40ac-a302-6a459ebf4245	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 12:37:35.435771+05:45
d7b0ad22-ef63-47b8-a733-817da9afea2e	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 12:47:41.414667+05:45
5ee9e21b-9e6a-4ea7-bf43-5f8ee5b4d1ca	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 12:47:54.832424+05:45
70337f46-a016-4e6c-b8cc-fe856dce3f9b	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 12:57:46.434689+05:45
567d304f-1090-45cd-9c56-00aa2ea81895	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 13:06:58.718225+05:45
3b221f10-7e01-4ddb-9378-80cafe854876	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 13:07:02.092499+05:45
fb4c5c41-144f-47b2-be47-27a14ea89f1a	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 13:31:25.06467+05:45
a7ed076d-c3f4-4888-b1f5-9f98ef5f2003	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 13:34:05.99564+05:45
d84e5caa-a8af-4f57-94a9-ab8b429a7643	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 13:34:13.3493+05:45
a4ece552-37c3-4b5d-96ef-2a8ed23c90dd	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 13:36:14.243818+05:45
28258d55-b3ac-44ef-afe3-bdc6da156590	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 13:36:22.155202+05:45
d73c1611-3138-430f-9a1c-637b28aaee99	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 13:38:56.019575+05:45
4931587e-e783-4af2-8558-7320e1dac865	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 13:40:14.764424+05:45
20dd0f83-7fcb-4551-8361-418f24ca44b8	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 13:40:24.644898+05:45
f3cc9bde-8f0f-46c9-a974-318528071eec	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 13:42:34.330003+05:45
12aed102-572a-4293-899f-f4df368ed280	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 13:47:09.340976+05:45
0d982901-3144-4bdf-9e60-7125439883d4	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 13:47:37.561756+05:45
e1cd41c2-63ea-4868-b5b8-034744426bb4	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 13:58:23.496725+05:45
6568a5aa-55d0-4b48-8bd2-9529611025ff	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 14:04:34.863747+05:45
50b18adc-ae3a-4a95-a1e8-ab9cf4f21c52	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 14:39:35.31372+05:45
3c338055-06f0-4eea-931c-1ccfb676a0d0	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 14:40:12.242608+05:45
4eed427a-3d9b-4bad-8211-f181bc629815	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 16:17:27.819366+05:45
437190c1-b9b9-4cde-ac2a-7bb0b61564eb	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-18 16:53:26.632708+05:45
e37032fa-202f-41fb-8ae4-5726aeb70414	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 16:18:10.178322+05:45
eea2c962-7360-49f8-88e1-086d0c1bf206	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 16:18:19.599975+05:45
55b12c06-1522-4401-ad2f-926c5fcdb798	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 16:35:46.803233+05:45
baaa0d66-bd8e-4b27-bde0-c12126a1984b	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 16:35:50.751509+05:45
a7b81efc-d016-4495-b7f0-aa92661b2b9d	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 16:37:22.099011+05:45
8c23e452-e16e-49ae-9a90-d47a14a63a08	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 16:37:41.202492+05:45
09d42090-e8da-432c-82b7-5a2431c78ef0	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 16:38:02.76727+05:45
94c6d464-eddc-47d8-a476-ebe32b6afd2f	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 16:38:44.091269+05:45
830118ba-066a-4683-9a43-7de05de7a5eb	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 16:39:00.642552+05:45
840dac28-0674-43b5-b136-769f9696d414	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 16:39:15.555532+05:45
6c5d8c1d-2542-4865-9b5a-3e70dc46a4e7	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 16:39:33.951447+05:45
4e90e90e-4a74-4e43-8799-04d44eddf227	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 16:40:47.738794+05:45
71938842-7f42-4c9e-ae80-721f16bec7a6	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 16:43:51.950903+05:45
d5a6d41c-c03c-4536-8649-40ca3660bf0b	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 16:44:04.626427+05:45
9a4f4191-d443-4b01-8a24-3320da7a19f3	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 16:44:27.272856+05:45
631ff01f-6251-4441-9ca5-311abb0ff3b1	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 16:47:15.22715+05:45
7c22a1e0-5e95-453c-8a67-c2e1b9ce7c34	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 16:48:05.692975+05:45
d2733413-155c-4964-a595-95c4a315d460	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 16:48:33.595116+05:45
b13a01ba-a965-4574-845f-4ef07626da93	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 16:48:47.91827+05:45
015a6bfa-2296-4348-9b63-31c5fd9d2218	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 16:49:13.200368+05:45
d3312e32-c2ec-4fcf-8d72-665b7d9d37cc	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 16:51:28.916293+05:45
8564015a-fd46-4917-80c9-58e36d651d41	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 16:51:31.344633+05:45
00c708b7-8801-402e-a213-cbdc2860cd14	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 16:53:51.731787+05:45
32c2cfd9-9c73-45aa-9f50-b25cee192114	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 19:03:39.226871+05:45
8c86693c-497a-4d45-b3f7-2fcb256e493e	11e156f0-797c-41c2-8322-5603e60a5fd8	LOGOUT	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 19:03:41.898992+05:45
8bfd1fd8-48fb-4f57-8d59-50266cccfef4	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 19:03:47.65966+05:45
40863a03-8b30-4498-9236-8e6ee0da3c93	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 19:04:37.269712+05:45
001163d9-2257-41d6-b7cb-18c0d3b411ad	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 19:10:55.175702+05:45
ca10a8d4-3647-4171-9f7f-f63cb6bdce96	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 19:21:46.439439+05:45
a7e5433b-715d-47bb-ba4e-90c71ab3f5da	b37d6f7a-4afe-4e04-8ce4-21caa59d6d23	AADHAAR_VERIFIED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 19:27:44.64813+05:45
3b50d955-91ed-4fde-a088-98a31e95a88d	b37d6f7a-4afe-4e04-8ce4-21caa59d6d23	CONSENT_CREATED	consents	7df59ddb-e409-493d-ac04-a95a52f8257a	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 19:28:02.032395+05:45
cbc7eeb8-d58f-497e-a202-6f5f79870d5b	b37d6f7a-4afe-4e04-8ce4-21caa59d6d23	CONSENT_APPROVED	consents	7df59ddb-e409-493d-ac04-a95a52f8257a	\N	\N	\N	2026-07-22 19:28:02.043041+05:45
de2ffa6c-27c2-4398-bd4d-3f1dd43e86c7	b37d6f7a-4afe-4e04-8ce4-21caa59d6d23	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 19:28:05.781275+05:45
a866ddd0-b794-4349-bba4-1e27a41bf2bc	b37d6f7a-4afe-4e04-8ce4-21caa59d6d23	CONSENT_CREATED	consents	fb3f15b6-b486-486e-9109-bbff3a983ba7	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 19:28:19.707872+05:45
67628b27-8a74-4b1f-838c-53deb2760f94	b37d6f7a-4afe-4e04-8ce4-21caa59d6d23	CONSENT_APPROVED	consents	fb3f15b6-b486-486e-9109-bbff3a983ba7	\N	\N	\N	2026-07-22 19:28:19.718349+05:45
64999db4-fd93-4c8a-af23-10be413b575f	b37d6f7a-4afe-4e04-8ce4-21caa59d6d23	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 19:28:23.407069+05:45
ac156316-1a8e-48a2-8794-a951d0c234e0	b37d6f7a-4afe-4e04-8ce4-21caa59d6d23	LOGOUT	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 19:30:15.922758+05:45
0d414f21-3116-43e8-aab9-5745b1890630	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 19:30:19.314603+05:45
54f0926b-1262-47d3-8a9b-4458ade6f5c3	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 19:39:10.61357+05:45
97694615-9eae-4efe-9dba-09aad4bdc83b	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 19:44:25.635975+05:45
b67749cd-1aab-4fd1-bdf5-bf2c2f594e8d	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 19:45:56.041275+05:45
1f306cb2-c566-4c1c-84de-1bf1516748a2	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 19:46:00.454047+05:45
ab0eac4d-19ce-4fd3-ad36-8c941ef4c758	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 19:46:23.79308+05:45
b6afbf2a-6ae4-4686-8934-69a840068231	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 19:47:25.330738+05:45
76cb7246-23f6-48f3-8895-f69bcc17c138	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 19:54:19.651094+05:45
e36f90af-105d-4589-9ddd-22869f6920aa	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 19:54:40.844322+05:45
204b395b-fc50-4d9f-b01f-a1c9fda1908d	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 20:05:26.912715+05:45
7ffee98b-21fb-462f-9d5e-fcfc36191803	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 20:22:05.566224+05:45
1a427310-0489-4e66-bae0-0c4f0551b21b	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 20:33:36.869536+05:45
69d1bfad-e23c-4015-a18d-ec85918cf823	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 21:01:10.067942+05:45
9619e0ca-a2e0-4189-9e97-5a8ecefc18df	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 21:01:13.259857+05:45
4341eae9-637a-447c-9c43-5a0a34a0cc0e	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 21:02:17.981317+05:45
1a0fd769-1086-4303-bf7e-1f8b014bb298	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 21:18:54.694226+05:45
7237835d-ffb2-45bf-a13a-d88343e04324	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 21:18:58.083855+05:45
1d6c6e89-fedb-4a68-ae89-33a85bbdb285	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-07-22 21:20:00.288631+05:45
d5f95e2e-1e75-4075-b331-badd58f99b58	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 13:06:25.671062+05:45
422c6394-9416-44e6-81f1-054e6f4d96db	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 13:13:51.768403+05:45
89364563-2c1c-4a28-89c6-53b365e496fb	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 13:15:40.518717+05:45
d8c4e7f7-4019-465a-875b-04e0407481b4	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 14:23:07.950957+05:45
21eee363-6bc1-4c3d-a79d-ffa570299fdd	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 14:25:17.494951+05:45
2351b3cb-aa3c-4a47-8f37-f0dd10ed129c	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 14:26:49.992587+05:45
fa4832f4-4f5d-45d5-8546-d0dc5bed30a1	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 14:35:21.120346+05:45
0da220dd-6612-43c7-a068-58cf386dcc82	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 14:40:39.869488+05:45
d39696e3-5c6c-4bb0-ae5c-35d6a6a62ea6	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 14:42:16.502705+05:45
a6ee7df8-453a-470f-8829-06d88143bd0e	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 14:47:42.400998+05:45
f054e875-1538-418a-b49d-45ef9b685844	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 14:48:16.216078+05:45
f38166bf-e52a-49db-a876-c29d978aac9a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 14:48:23.586227+05:45
5821888e-b277-47d6-bd59-6b130acb6287	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 14:48:48.646694+05:45
72b195eb-1267-4f57-9647-78e42ba04711	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 14:53:22.018411+05:45
e9b44536-3034-452d-ba8e-08dc241dc0d3	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 14:53:29.431901+05:45
382bb900-2df6-471d-87c0-ccdf6b868215	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 14:53:41.438561+05:45
a3e99607-c43a-4ff5-ad2e-4731a8e23d9b	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 14:54:44.097964+05:45
86337179-ef72-4e14-8a3a-dc2d64dad234	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 14:56:31.275092+05:45
d5ef3410-ffa5-4c39-8ca8-7737b06eb03e	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 14:56:33.070947+05:45
cf29a9a0-37e0-4b72-82cc-1eadefbbadbe	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 14:56:37.793438+05:45
54ab8d40-a34b-4faa-bea7-0e33e67186bf	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 15:02:23.48291+05:45
842348b9-6fc5-4ff2-91db-34232fa59cfd	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 15:19:21.808603+05:45
5afa4627-8b16-4be9-94b5-bdeca51ddb00	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 15:19:23.806396+05:45
44f87a4a-5371-42d9-9218-8812052324ff	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 15:19:28.592906+05:45
19a1a66f-cda2-4bd3-b17e-8a7011323e21	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 15:19:40.042856+05:45
879ed297-a33d-423b-a879-21b3cfad9d18	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 15:19:48.725915+05:45
f7f1e322-4d94-4242-93c0-88331906347a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 15:27:29.885593+05:45
91313958-a5e1-4312-a157-9eb7bf3e0c7e	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 15:41:35.15904+05:45
86615902-f9ab-42f2-b91b-cc9d3e8a26d0	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 15:41:58.937015+05:45
95d2a2da-6d3b-4425-bb59-a607604ea985	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 15:43:40.11555+05:45
1b6a9fb3-8d24-490a-a353-9daf5c23a758	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 16:17:01.924257+05:45
c9151808-8422-4cac-b3f7-2cbee32de8cf	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 16:17:07.04869+05:45
508d0dba-88c9-4cbe-9a95-f88726b478ee	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 16:20:46.570518+05:45
f65367cc-f4fc-415a-a5a3-53ff532f3f85	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 16:21:42.599151+05:45
8dfc3537-23e9-4482-9a8a-e10512e2802f	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 16:22:40.162165+05:45
558d97cc-5b20-44be-bc63-05e166b54829	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 16:24:22.47625+05:45
518afdab-d943-44f6-ac28-f592a0536cc9	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 16:25:53.261515+05:45
78ac7ff8-f1f1-4fda-acd0-09fcda0116d0	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 16:26:36.234495+05:45
f21ab3f5-37a7-477a-84de-6b992d81dd66	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 16:27:43.035611+05:45
74eb7f60-2d83-48d9-a796-068dbbc7d81a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 16:29:52.056308+05:45
f953ccd5-a5ea-4973-a0ed-b6b149d44913	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 16:30:03.201842+05:45
62700f55-b7d0-4971-af8d-854b48c3a1cc	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 16:33:14.485531+05:45
a5c0d6d6-06af-4226-8764-7e1c18430f68	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 16:33:17.499657+05:45
0b376b5a-759e-40d1-9c71-2598a2d0838b	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 16:36:57.931331+05:45
84859741-39f2-4d74-9e0a-23c000fcc6da	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 16:37:08.154156+05:45
6a8cfdde-0926-44e1-a0b6-bc888a141f5b	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 16:38:56.979248+05:45
9b894562-fcbc-4aca-b657-71b03b46dbf8	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 16:39:20.235901+05:45
7d438f96-8c9d-45b5-8d88-57d49ab60cf7	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 16:39:40.519974+05:45
1d0d9da8-5173-40a0-a8c3-2c6005903a16	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 16:39:54.630831+05:45
3209e7e8-176b-4f43-a0b0-07369efe3462	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 16:40:02.449585+05:45
dfc74da5-6b10-4bfa-8542-847947273367	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 16:40:36.383603+05:45
69e037c8-fc24-4442-b508-815ef35e1be9	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 16:43:54.64307+05:45
030f70cc-6437-485a-ac6b-bebc32289b0c	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 16:44:04.016407+05:45
d5356b26-09d7-4c53-88dc-7eac9ecdb8ce	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 16:44:12.702055+05:45
8568a795-85ac-46d9-a007-85cfe4c28b5c	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 16:58:33.053751+05:45
854e9227-2449-4653-af16-59fa4d8882d1	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 17:45:38.023814+05:45
2f76c8a3-ab90-45b5-afcb-1cae46951ccb	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-02 18:16:18.978804+05:45
01dfd393-9ae8-4d4c-9923-d6bc9aebff91	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-03 00:13:05.230054+05:45
43913a2c-b275-4e42-a626-a485227c5b6d	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-03 00:13:24.645587+05:45
dca3e7ae-08b0-4ef6-9e30-476dd9888eb1	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-05 22:59:03.177999+05:45
c8cc1c08-d979-4b1a-9418-1de535cfd463	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-05 22:59:29.763263+05:45
d3bd3246-1118-4f54-8167-50a54e9dc795	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-05 23:24:15.560024+05:45
0cb371ee-f9f8-4f2d-ad01-566f96086bc8	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-05 23:24:16.645455+05:45
0e6e9ee6-15d2-43f9-a154-83a3de2bd89c	38b575ef-3220-42fb-8d4d-8dcf15ecab3b	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "low", "creditScore": 620}	2026-08-23 01:08:28.747798+05:45
6acc3a63-81b5-4355-9405-e88185ac11cb	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-05 23:24:22.931821+05:45
5ce30eb1-92f5-4892-9631-ac0749b17407	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-05 23:24:47.733321+05:45
35e8af42-d182-4ad6-bdd0-1aac6be8bc13	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-05 23:33:07.615351+05:45
48b645b3-d3be-422f-912b-c47eb63c1cff	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-05 23:55:57.50782+05:45
bdfccc08-8ec4-4d8d-ae94-a96d892ed012	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-05 23:56:41.914804+05:45
f9473046-7f5b-4fa9-86be-73f2f003a3d1	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-05 23:56:45.262081+05:45
e24619dc-ea75-42f1-87e6-f1214bfb9733	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-06 00:21:32.365653+05:45
a9bc889a-5296-49cb-9079-afaa13bf7948	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-06 00:21:44.558237+05:45
60d0fffe-7b79-4bce-8362-7212d5d75cb2	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-06 00:22:06.241143+05:45
9ef34fd2-bdc2-4f6f-bfcd-fd3e60e55332	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-06 00:22:08.347215+05:45
d3852194-977c-4373-9391-1787fcf0a01f	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-06 00:23:11.718787+05:45
c529273a-df7a-46f0-a0ba-8b1fa9268d71	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-06 00:23:15.89473+05:45
db855644-0769-417a-a6ba-e477d97e0281	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-06 00:24:54.244379+05:45
123fa14e-0611-466e-b226-1ba5491d28a4	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-06 00:25:39.392494+05:45
28fbf754-edcb-4c8c-9db2-f7e86b73fa21	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-06 00:27:31.257578+05:45
3524b05a-92fd-4b92-a646-d7ccd959c2e9	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-06 00:27:35.407035+05:45
1d9b1e1e-5390-4d3a-b0a5-bcc3544a9d93	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-06 00:27:47.954256+05:45
6554f773-149f-47f4-bb85-b8522cf8e18d	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-06 00:27:53.144226+05:45
356c0a63-4d48-4130-a921-78eb2628c993	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-06 00:28:21.985093+05:45
6a00057c-eb96-4cd7-92a8-adb6d20ddad2	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-06 00:28:24.192817+05:45
d660c5cc-72ae-4945-9e37-6cec408570f6	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-06 00:31:42.837645+05:45
8794c807-51e6-4180-a3a1-85f94c3c5d08	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-06 00:33:23.23375+05:45
a9f3a4b6-2887-407b-83ac-aff8169a8c4f	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-06 00:33:26.344712+05:45
540f62f6-a62f-4ba2-99fc-8a1ff71e6ded	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-06 00:35:11.929693+05:45
9fbfa104-d459-4c83-92d7-5edf047de363	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-06 00:36:03.533001+05:45
18fa1456-056a-4e3a-96ea-00aaec189c7e	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-06 00:38:47.155476+05:45
3126cd4c-ea39-4f72-b507-38638315f780	11e156f0-797c-41c2-8322-5603e60a5fd8	LOGOUT	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-06 00:38:48.887289+05:45
1590ce99-7e91-4621-ba47-f95ecf9aee64	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-06 00:42:28.116371+05:45
21c44f93-4021-4880-a319-57ecaf9962d4	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-06 00:42:43.761751+05:45
ad1ad4b3-33d0-44cf-b5a0-b124f2df4459	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-06 00:49:23.79348+05:45
ed18b930-24e9-4885-b450-22a241b1a292	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-06 01:00:13.653425+05:45
3f0c43aa-35db-4016-8c85-91ec5c2e0885	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-06 01:09:26.124909+05:45
04ca9dc2-1264-4102-b878-b3eb12bf493b	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	\N	2026-08-06 01:42:56.133439+05:45
8fa6b8af-b752-4616-9709-e20a8be0e832	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-06 17:25:29.949793+05:45
25960903-60be-4657-bbd1-855d159cfbf8	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-06 17:36:12.845814+05:45
0fee2e03-27b8-44b9-a753-690a4a2e762c	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-06 18:14:47.074606+05:45
b055c524-5508-46ce-aefe-bfaa392f6798	11e156f0-797c-41c2-8322-5603e60a5fd8	LOGOUT	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-06 18:14:48.84806+05:45
8c6d457f-d1f2-4b69-af3b-578347fe13d7	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-06 18:14:56.019085+05:45
29d3bb9f-a6c7-4cf5-b917-fd7a4153de22	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-06 18:15:20.717652+05:45
801ea1fd-702f-4ab6-84bd-b53f4e443961	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-06 18:26:17.222296+05:45
85edc473-f14f-4ee9-819d-0208cbeb8e99	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-06 18:32:46.853003+05:45
113b38a9-e265-4b1e-9d1e-f44558d4240d	9f670447-f910-4e6f-b0ee-2f55eed3a26b	LOGIN	users	9f670447-f910-4e6f-b0ee-2f55eed3a26b	127.0.0.1	Audit-Test-Agent/1.0	{"method": "phone_otp"}	2026-08-23 01:13:34.911771+05:45
5af1066a-eee2-433d-acfe-51cc6b9d4f93	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-06 18:32:48.25871+05:45
3ecada11-b197-4197-967c-2d70dc4b3ff4	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-06 18:51:05.523083+05:45
80ffff39-2004-4a40-b17a-ed887d39674f	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-06 18:54:15.409066+05:45
15f1d61c-edd8-4c75-9387-f5a58798a269	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-07 16:34:39.558165+05:45
990053db-33e5-4f4a-9fe2-dbcc0679d076	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-07 17:07:59.40918+05:45
c9484d9e-3fd0-49d1-be46-170050e1bd34	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-07 17:08:12.237707+05:45
53934c74-1ab4-4514-b6e6-b0c6bc0078a2	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-07 17:17:52.863102+05:45
135d8662-6a05-4a08-be2c-88a7c548ce48	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-07 17:19:25.542091+05:45
f591cbd0-30c4-4260-940f-5a513e4548ce	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-07 17:23:21.135397+05:45
cbcf4973-0aed-4f2b-b5ca-7ec1b9018fa6	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-07 17:24:17.814754+05:45
8ec301c2-bdd9-4634-a7b4-21f470e197f7	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-07 17:26:29.830153+05:45
90ae9116-fa6f-4762-92d2-1cb3b3766424	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-07 17:40:35.42319+05:45
06c36340-4ff0-459c-9af5-649ee4ca22f8	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-07 17:40:36.049246+05:45
68e74ad6-9a7a-4b7d-97f5-dcc367f50053	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-07 17:41:32.346879+05:45
f2569f59-9c32-4591-89a0-1b6e5022bda7	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-07 17:41:44.002406+05:45
de148f19-e6ab-4eb9-88df-6cfc3b18f518	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-07 17:41:54.176993+05:45
784d216f-7b39-43b8-a945-7e7ffefd73c6	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-07 17:42:02.97936+05:45
f011a411-c5cd-44b6-9d21-2a81b382f803	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-07 17:42:12.728099+05:45
6c329327-9ed5-48dd-8e46-e162f4014dcf	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-07 17:46:32.261824+05:45
7048feda-a348-460d-822f-b24736b98b8d	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-07 17:48:18.596172+05:45
f356575e-c2b0-4e8b-867f-130c63fc7aa1	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-07 17:48:28.01528+05:45
21056fdb-05c0-465a-a9f0-2b27678013fe	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-07 17:51:59.475475+05:45
366d1599-e7aa-4023-be07-5a4652381192	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-07 17:52:04.43098+05:45
2adfeced-27f9-4544-83ba-d04d8b5bd995	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-07 17:52:12.535108+05:45
113ab92d-b349-4aa7-8e91-6958295756a1	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-07 17:55:44.930181+05:45
399aea1d-703b-4ffc-8f1e-80e480f628cf	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-07 17:55:51.065807+05:45
3351f76b-4e6e-4ad2-aa71-048236b43921	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-07 17:58:52.615061+05:45
a17043d0-00dc-4c9f-9a60-33cce49e46d5	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-07 18:02:43.07878+05:45
69729601-ffa4-4488-a456-4aec325d18b1	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-07 18:06:15.71754+05:45
0aff2311-cbe7-442a-9e36-ea9e33565243	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-07 18:06:38.797139+05:45
0550d88d-51e6-4b92-b888-bfb4b24d2d0f	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-07 18:10:13.929682+05:45
af057126-0c60-46e7-a7b9-cedd8bec3ecf	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-07 18:10:28.616856+05:45
ea0f0ce3-8cac-4d13-881a-bdc3b924cd4c	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-07 18:10:31.684664+05:45
064897b1-7669-498d-ac09-cb04a8726fcb	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-07 18:10:36.39411+05:45
ace0ab93-9f38-4bad-ae0c-4f88d061b640	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-07 18:11:50.129089+05:45
215f42d2-8465-4f20-9520-07f7d1335fe5	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-07 18:22:43.114466+05:45
bd994e22-7075-42d6-86bc-c612d37bef7f	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-08 15:57:40.852707+05:45
06ae4a4c-449b-4bdf-b8de-2728fb0fd201	11e156f0-797c-41c2-8322-5603e60a5fd8	LOGOUT	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-08 15:57:42.840644+05:45
06f4fba7-afb0-4837-8cad-ac2fcac3066a	9f670447-f910-4e6f-b0ee-2f55eed3a26b	PHONE_VERIFIED	auth	\N	127.0.0.1	\N	\N	2026-08-23 01:13:34.947662+05:45
3abcb72f-df48-4a27-beb5-39d8e6da82e0	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-08 15:57:58.340883+05:45
c894520f-9cb8-4b47-ba5a-3c020ea49e71	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-08 15:58:49.141252+05:45
a5227165-1f0f-420f-9ded-5e035b602384	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-08 15:59:07.929645+05:45
7dec271b-ce41-442b-9f93-cd98a86ab071	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-08 15:59:18.275113+05:45
db43d6e7-36c6-4d4b-9c97-2b7e9f972675	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-08 16:04:21.393457+05:45
1a000537-bc3e-49b2-9979-95bd216339fc	11e156f0-797c-41c2-8322-5603e60a5fd8	NOMINEE_BATCH_CREATED	nominee_batch	e7196a67-d2f2-4082-abcd-571ee2737df5	\N	\N	\N	2026-08-08 16:07:10.332452+05:45
1d9adaff-5e57-4a01-88dc-cdcfccfa8fbf	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-08 16:07:22.482153+05:45
d234c481-9f19-4f3f-b344-9e3816b38d14	11e156f0-797c-41c2-8322-5603e60a5fd8	NOMINEE_BATCH_CREATED	nominee_batch	00509b31-e3b9-47ca-9af5-33ac9094db79	\N	\N	\N	2026-08-08 16:10:45.469157+05:45
4fed62a9-3402-4bbe-b8c9-a9a3befc3aa7	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-08 16:10:49.499005+05:45
8c227740-3349-49e7-a14c-239cb588b6a8	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-08 16:13:38.725064+05:45
c2db19f1-b104-4371-9524-05c94b4124a0	11e156f0-797c-41c2-8322-5603e60a5fd8	NOMINEE_BATCH_CREATED	nominee_batch	92585c8c-5337-4899-93d4-2011bb6ef0a8	\N	\N	\N	2026-08-08 16:13:52.162413+05:45
d86829ea-7b33-4886-9ede-69db19e4e367	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-08 16:13:55.896119+05:45
414a7d24-3746-4830-b006-be3b5e319ccd	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-08 16:14:09.677316+05:45
6587459d-d647-4144-b2d3-f2fa41a10f77	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-08 16:17:24.816891+05:45
af04fb38-28a0-42da-b8e6-53de4a15c6ab	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-08 16:39:32.90088+05:45
8cfd1ba9-6964-488d-90e8-dcce5d708fce	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-08 16:39:35.359599+05:45
a691af12-8f9d-464b-a8e8-11d0fcb1cf28	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-08 16:49:56.968453+05:45
4928e22f-cfdd-49e8-a2da-9bdb76993ef0	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-08 16:50:23.405428+05:45
dadb35a3-030b-40a6-8272-7ce70cb08fdd	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-08 17:09:11.73773+05:45
f7fbc73e-104d-4879-b0a8-4b7d6d6b946d	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-08 17:12:00.347211+05:45
5ae5d7e2-88eb-40cd-9d5f-c6df824942af	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-09 12:57:28.120507+05:45
f6aad7aa-fc9e-4019-a589-12678d469837	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-09 22:25:34.050845+05:45
0fb31c4f-83d9-46de-a070-6a60a63dbe9a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-09 22:34:32.715853+05:45
0072e09e-697d-47b0-84c2-3a9a069d60a4	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-09 22:37:49.28744+05:45
4503fdaa-b0ad-4720-a3c4-aa8bebb857a6	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-09 23:04:12.383625+05:45
9c7d6364-0f7a-4139-ba10-83ec21fd9160	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-09 23:20:03.148015+05:45
d3148e24-cd59-45e1-8680-529fd97d63c6	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-09 23:20:11.967084+05:45
d99c3d7c-1906-460c-bfb4-93bf6bac98ad	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-09 23:36:32.285905+05:45
7919480c-a429-40ba-8851-e4155defe4f7	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 00:01:04.54552+05:45
3f4c4a03-0423-437f-82de-0c3142569889	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 00:01:06.576228+05:45
81c016cb-812c-4efa-83bc-c1b83751e493	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 00:03:51.166046+05:45
c4f454b1-c613-471a-bb11-33106894f5e2	11e156f0-797c-41c2-8322-5603e60a5fd8	REPORT_GENERATED	reports	1e4242ea-35a7-4f0a-86cd-1e10128afbb7	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 00:08:26.783722+05:45
97439c39-15ff-4405-ad67-0744e6ccd688	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 00:12:21.93869+05:45
7b60609a-7f6d-41c1-9e3d-d5b622b90682	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 00:17:13.207561+05:45
2ee6cfa1-b1bc-4dc2-9dd4-a43ab436c8e3	11e156f0-797c-41c2-8322-5603e60a5fd8	REPORT_GENERATED	reports	baa2e377-6f9e-4850-b09d-78a0a195c949	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 00:17:13.960482+05:45
a0956745-3131-435a-b021-2cd86b181325	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 00:21:31.459048+05:45
4ff90e07-6191-4d62-bf07-d796fea9eb02	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 00:21:41.540934+05:45
4397034a-b317-4e5b-83ed-e5fd6ba0d31c	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 00:23:43.463874+05:45
471cbf07-1319-4e44-bd5d-0b1a9b9f5677	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 00:23:43.596326+05:45
b3ea9b8e-23f9-49ff-84cb-53ad51a415bd	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 00:32:32.903245+05:45
919e10aa-d79a-4ed2-a961-66a2650545d8	11e156f0-797c-41c2-8322-5603e60a5fd8	REPORT_GENERATED	reports	0fbf734e-6297-4042-aee9-e07207785d58	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 00:32:39.416755+05:45
96d3b8d5-228b-4183-abf3-f38aaf0885ba	11e156f0-797c-41c2-8322-5603e60a5fd8	REPORT_GENERATED	reports	7a05bcec-4e6d-49d3-8ec0-6200e8b6bc15	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 00:36:53.70034+05:45
1c170b8b-7e85-4e7f-8f60-39b5a3717d21	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 00:40:51.116236+05:45
be933467-299e-4fe2-ae6d-8642c6565817	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 00:41:59.399164+05:45
743ed965-f0a5-44a9-bae3-baef3f46cd00	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 00:42:14.251025+05:45
ca34f64e-e9b0-4b58-9561-26f646fe0a02	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 00:43:59.860682+05:45
a02901ff-03af-4d46-b894-b140dab72b55	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 00:44:17.903736+05:45
5389ddc2-e7d3-4ccf-b222-06eb39cef112	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 00:45:51.098442+05:45
66bc4ea7-958e-4cb7-9c70-e0c295286d26	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 00:49:28.392549+05:45
58e2434b-1034-4626-ab0b-7681bec27402	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 00:49:29.014471+05:45
68524c2a-f29e-4593-a3a6-4c7f2a1b2fb5	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 00:51:26.098945+05:45
013ba7de-5dfb-4856-881c-8cf51cf75e58	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 00:55:26.494938+05:45
97c9996d-7814-464e-9c9f-a49a69f5f517	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 00:55:51.896456+05:45
7a3825ca-5be0-4734-a3e0-d4d426e3a49f	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 01:29:09.729733+05:45
c92e109d-e434-4648-bef3-ab5b28fb5c84	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 01:34:18.72142+05:45
1c33583a-c18a-4bcb-bd9e-9b170af0a9f6	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 01:41:26.984414+05:45
0586064b-f02e-46dd-bdae-1538e29ffaa5	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 01:41:45.579486+05:45
2c02fd2c-730a-43e9-afd3-407d39ad0ba4	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 01:42:56.334897+05:45
4f727e45-e4a2-4fbe-b9f4-6c7c68931d30	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 01:43:02.138077+05:45
4b4c065c-a26b-4b69-9884-532083b0fa0c	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 01:43:24.260879+05:45
b5162063-6602-4c4b-9e85-73f72bc4904d	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 01:47:39.676738+05:45
10c40c77-6f29-4bb1-a2bc-b42608915459	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 01:49:07.255581+05:45
eb4c6961-5ceb-495d-82fc-c2a73754875a	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 16:44:30.563633+05:45
08e0ef67-4af4-466e-8bdb-4bacf745db32	11e156f0-797c-41c2-8322-5603e60a5fd8	LOGOUT	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 16:44:32.267085+05:45
97d55e6b-68d0-48f7-91be-36cf08fa5e72	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 16:45:40.263461+05:45
d431c664-7938-46ee-af99-109c52714da1	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 16:51:31.965074+05:45
cf666d3e-ddd8-4282-8ea2-b2a8bb5513ba	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 16:52:22.39477+05:45
ced9f25d-2678-4968-9c5f-faaf83851686	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 16:53:07.529701+05:45
ff8306dd-1985-4735-a4de-43752692e1bc	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 16:53:35.425888+05:45
82d78d41-4d31-405e-ab8a-e7fb1fb9dfce	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 16:53:41.394103+05:45
c2b7c8eb-39de-4337-920d-431d165788a3	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 16:53:47.094706+05:45
21662833-913d-45c3-aada-43657acf7034	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 16:55:31.464612+05:45
f24a2abf-c61e-4bbd-8f5e-a6ce17dcd333	11e156f0-797c-41c2-8322-5603e60a5fd8	LOGOUT	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 16:55:41.876218+05:45
26e021e2-5844-4f57-927e-9325bba4e489	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 16:56:18.919761+05:45
22aa9f90-88ce-45aa-b937-1ce5f2563faf	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 16:56:47.348731+05:45
4c56db06-0e35-499c-abec-e990200d4125	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 16:59:28.247641+05:45
259c3cf7-e9e7-4139-8a90-d57d43804d98	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 17:04:54.393956+05:45
28c196d5-3859-4cb7-9075-a31f70ce5f80	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 17:08:55.443212+05:45
9085e620-0cb0-4541-92c0-0b065867ec3f	9f670447-f910-4e6f-b0ee-2f55eed3a26b	CONSENT_CREATED	consents	b39ecce2-7907-494e-8b8d-1cc66af7711a	127.0.0.1	\N	\N	2026-08-23 01:13:34.952777+05:45
c3430179-8ab0-44d4-989c-255a1091a706	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 17:24:30.701181+05:45
7e3179cb-4a5a-4a33-8972-ae12f65c9b53	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 17:25:46.234489+05:45
88f90cdf-9aba-4108-9412-abf8f025884b	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 17:25:48.63247+05:45
3f356f5e-c4d3-4cb1-b0fd-9fa1db7dd6e3	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 17:30:56.1763+05:45
f1d6bbf5-b306-4cdc-a483-8c348ac2a1c4	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 17:42:32.873589+05:45
a380f204-3eb4-4a5b-87b5-7b7d124ab1b1	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 17:52:49.252663+05:45
ec79ef6e-4bb7-44f9-a107-c87c40bde661	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 17:53:40.225439+05:45
f4c16820-5db6-4e21-88ed-12839b19802b	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 18:03:38.097195+05:45
a4066abb-0125-4b91-9290-f753a065f8d4	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 18:03:40.494032+05:45
2b8ba1b8-25ce-4b6f-be9d-65881e08f79d	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 18:03:50.31204+05:45
10895cfe-2e94-4b78-8550-a0b4f40b30e7	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 18:04:54.341071+05:45
2042cbbe-65c5-4610-9116-45ddf82e197e	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 18:06:24.547449+05:45
a45f927f-36f7-4d9f-8573-71b8ac839efc	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 18:07:21.152435+05:45
e7020ebe-6950-4ca0-9d3b-629ed53a8cdb	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 18:11:53.528428+05:45
239785b7-9960-4d6c-a19d-50d8bdab9349	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 18:12:01.708336+05:45
81466f53-49bb-4868-bb35-ab68b852fb34	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 18:18:40.337874+05:45
67f76aa1-c44e-40bc-a613-dc68c8a51972	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 18:19:10.250539+05:45
846c1847-5852-42b2-89f3-1ddca7b692d3	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 18:20:19.776219+05:45
a3955ce2-df19-4f5f-9506-8e08ed3767b4	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 18:20:46.217526+05:45
42d51d86-bceb-4467-a787-17ac87e57449	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 18:21:38.980103+05:45
cc517bab-622d-464b-9992-ea4ce4886dab	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-10 18:21:42.651464+05:45
47cc7e78-6385-49a4-8ce8-18d90ffdf7c9	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-11 15:31:00.287855+05:45
18da3968-546a-4464-a78c-ad1a5bfc4e36	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-11 15:31:04.244011+05:45
8bb0458a-5270-4798-ba9b-c0e2b16208a9	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-11 15:49:05.884466+05:45
e2a145d1-4951-4585-b570-5f823e22a49e	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-11 15:49:06.501886+05:45
88b22303-898a-4dcf-bbd3-d5992b61a323	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-11 15:53:13.931698+05:45
30dc57e7-0a34-4d81-beda-2a5da1463506	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-11 15:53:18.990792+05:45
7f5ded57-3b25-40e4-a62c-2712e7f0c443	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-11 15:54:04.22705+05:45
5f8af05c-c44c-4ef0-b031-0fd23c170b1c	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-11 16:03:17.573329+05:45
5c001694-9e9a-4e47-96b1-c0855fdfaa4d	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-11 16:28:37.021494+05:45
c59eb890-83b2-4438-9d48-7c63cd1ac9a0	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-11 16:28:58.768781+05:45
cef9222e-2826-44d7-bc71-500a76f164dc	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-11 16:43:53.634457+05:45
95fa0462-3402-4387-ab80-2df995425efc	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-11 16:56:16.656008+05:45
4c67c03e-a72b-4d4e-968c-a015159e8077	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-11 16:56:24.72514+05:45
860fbfa5-2b62-43e6-b7ed-8027fbbc92f7	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-11 17:44:24.409278+05:45
ca9a97b0-bfc2-4e70-a069-4d08b913b59f	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-11 17:47:38.372741+05:45
e2d1b504-93dc-48a4-a97d-e09d6233fd49	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-11 18:31:55.396262+05:45
6c01920c-a4be-480a-801e-7de9e9211d9c	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-11 18:31:55.97501+05:45
954198a9-443e-4c6e-8580-17639ed22b07	4364b6ac-3743-48b8-a526-1146530078a1	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "high", "creditScore": 780}	2026-08-23 01:13:34.982645+05:45
95f4fb26-b072-414c-99b9-3604383d9489	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-11 18:43:23.971984+05:45
341a8124-8892-41bc-9a21-8cad2dc64f7d	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-11 18:43:56.147746+05:45
19f83f24-c606-4299-8a8a-8bdd4cf75c68	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-11 18:47:08.932596+05:45
0e457f20-4f7f-494b-9988-219e89d078c1	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-11 18:47:12.645189+05:45
31b4cb84-81d1-4215-8158-3334a02d18c6	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-11 18:47:21.232093+05:45
160201f6-f66e-4a79-b86f-4a242b36bbf5	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-11 18:50:45.274965+05:45
8638ec77-9a7d-4986-a397-1f2ca7abeb8a	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-12 00:28:45.287452+05:45
54f5c002-a76c-47be-9ba8-0797c98e0c40	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-12 00:39:34.126324+05:45
3d0b133b-b413-4605-9892-702be45265ed	11e156f0-797c-41c2-8322-5603e60a5fd8	LOGOUT	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-12 00:39:35.779569+05:45
7045a905-90d8-40f8-bddf-d0894792335e	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-12 00:40:52.916199+05:45
240fd9ea-9923-4cbb-8b86-9c1a9fc3c918	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-12 00:52:37.644317+05:45
4fd83ed3-7001-4fb3-ab2d-fb4c278e9876	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-12 01:04:38.399121+05:45
b3e599f9-55eb-457a-bc35-5ee7e406c5ee	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	axios/1.18.1	\N	2026-08-12 01:05:14.587073+05:45
58abd484-1550-4369-b4ae-131ca2ad626c	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	axios/1.18.1	\N	2026-08-12 01:05:52.539174+05:45
bb77dde8-8a2d-42ec-b1d8-3e74987122b5	\N	AADHAAR_INITIATED	okyc_transactions	03bb8b36-3c88-46ee-a468-384efa1c787e	127.0.0.1	\N	{"provider": "Setu"}	2026-08-12 01:17:29.812782+05:45
e948711b-ce2a-4401-b8bf-47d455adce6a	\N	AADHAAR_INITIATED	okyc_transactions	47766f64-8233-4e4b-a726-56c9a735887c	127.0.0.1	\N	{"provider": "Setu"}	2026-08-12 01:17:38.731536+05:45
f5aab264-af32-42c0-92b0-8ce42c378828	\N	AADHAAR_INITIATED	okyc_transactions	c60ecb3d-a2a6-4978-bafd-f77822072b7e	127.0.0.1	\N	{"provider": "Setu"}	2026-08-12 01:24:32.091838+05:45
253c7d34-dd7a-4c19-9d48-89c29be8ac89	\N	AADHAAR_INITIATED	okyc_transactions	3ad590a6-42a8-4c70-82aa-c2f0d5c3816a	127.0.0.1	\N	{"provider": "Setu"}	2026-08-12 01:25:04.72496+05:45
6df6ba81-fe67-4edf-8a9c-b719ec195b9b	\N	AADHAAR_INITIATED	okyc_transactions	\N	127.0.0.1	\N	{"provider": "Setu_Web_Redirection"}	2026-08-12 01:32:17.80891+05:45
3405fa47-56ae-4abd-a3e4-59fc94289f0d	\N	AADHAAR_INITIATED	okyc_transactions	\N	127.0.0.1	\N	{"provider": "Setu_Web_Redirection"}	2026-08-12 01:32:35.408888+05:45
738a7a86-39bd-47a4-8b74-9d6914f2e844	\N	AADHAAR_INITIATED	okyc_transactions	\N	127.0.0.1	\N	{"provider": "Setu_Web_Redirection"}	2026-08-12 01:32:51.733616+05:45
0b807337-e58a-4b05-9615-50d9e13d03fd	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-12 01:44:36.839852+05:45
2794813d-9a3e-4ce3-8209-b99b3cfa66b3	\N	AADHAAR_INITIATED	okyc_transactions	\N	127.0.0.1	\N	{"provider": "Setu_Web_Redirection"}	2026-08-12 01:45:28.158501+05:45
c052e3b7-33ab-4f80-a3d0-b941a53d20f0	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-12 01:51:27.27101+05:45
a469c0f3-73b3-46c8-9299-0aa1dc04b3b2	\N	AADHAAR_INITIATED	okyc_transactions	\N	127.0.0.1	\N	{"provider": "Setu_Web_Redirection"}	2026-08-12 01:51:44.371141+05:45
a0484268-3606-401d-a68a-a9dfa70828a7	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-12 15:41:55.612948+05:45
e690e8f3-e3a1-4be8-a71e-989523eb54b8	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-12 15:43:48.681062+05:45
db9aa578-2d3b-49bf-a9f5-8be45c9c520a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-12 15:43:58.849366+05:45
22bd3b2e-8816-4efb-9918-028dc5c8d64a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-12 15:44:06.002439+05:45
f4e23d2c-b1de-4e12-b553-9edc9ff1ddd6	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-12 16:04:38.713383+05:45
f2f59ee5-2fc6-4c70-a715-9210c580eb54	11e156f0-797c-41c2-8322-5603e60a5fd8	LOGOUT	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-12 16:04:40.334433+05:45
b1ae5b63-e6af-43f1-97d9-53eaef0bb65a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-12 16:05:36.649954+05:45
d6e59e34-51ed-485f-917c-67be5f4b8c49	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-12 16:22:19.777303+05:45
b844a399-20f6-4e6d-8e4b-f69dcc1dba32	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-12 16:23:22.601545+05:45
5c1aeda3-2125-4060-8c2c-8b33d1f8ba11	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-12 16:47:12.699997+05:45
6b195bf2-cb4f-46db-b6cd-9389d1f5d85a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-12 16:58:49.131996+05:45
c158e599-bc64-408c-84a5-f58e157446f0	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-12 17:02:31.31963+05:45
8dab9881-8c04-45b4-a932-75bda5a06706	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-12 17:02:31.897061+05:45
bdf7d28c-7784-446d-be64-30394605e2c3	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-12 17:02:42.10812+05:45
4714fd07-fcc6-44aa-9db1-e5a997c8b4df	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-12 17:04:14.292281+05:45
3af5805e-b231-4d5a-a5ad-eec25df8799c	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-12 17:05:44.093722+05:45
20de52f5-8348-4556-b8c1-de9ff219085a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-12 17:13:28.298353+05:45
7841df4d-c65a-4b88-a059-190a44b4273b	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-12 17:13:53.619242+05:45
4ba832f9-d7f6-4f58-81d2-2cdef45a5f22	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-12 17:36:34.667465+05:45
33768d61-ecd6-4364-9f44-b00d77264873	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-12 17:36:37.334418+05:45
83e810c0-4621-45ef-9508-5b15ff5a50d1	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-12 17:42:31.26039+05:45
41adcfb4-6fff-4cff-93f9-3a2132a7df62	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-12 23:02:05.473618+05:45
7fb871cf-0866-4ee3-a257-988d5e349b34	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-12 23:02:09.348829+05:45
2919fe2f-f146-4a9c-a9ee-8b62eda4faa1	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-13 15:31:58.20663+05:45
e64d9de3-9995-4bbd-b259-ef5390bfb741	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-13 15:32:00.597592+05:45
5f916936-31d6-48c3-8eda-a7bd0f62841b	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-13 15:35:51.109532+05:45
b1d1b239-2304-46cd-bfc0-6dcc4aaaf249	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-13 15:47:52.143657+05:45
f1dba766-8be0-400c-8d6d-77c7a904c4ed	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-13 16:07:08.730074+05:45
e625d6a5-809a-43d9-b509-54f53ee4893e	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-13 16:07:11.203802+05:45
8bb1e87e-de81-45f3-a3de-d52b20a7ec82	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-13 16:08:56.794635+05:45
e40da27d-4ca2-4ef5-b5e5-71d1c65be2ec	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-13 16:14:27.383314+05:45
1ccade3f-a009-4fdd-ab38-a0d403db41c9	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-13 16:22:51.769484+05:45
d8030170-1801-4d83-85c6-b50ce110aa2d	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-13 16:22:54.028908+05:45
a05a3483-19aa-4986-bf35-bb397ce6e3da	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-13 16:22:56.62071+05:45
431a6ce9-a878-452a-87e5-153231f5c6a6	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-13 16:24:16.403441+05:45
bbfdf767-a15a-456e-82dd-24ace2ca50a0	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-13 16:27:03.002882+05:45
a07d8d0b-9f59-4b0f-a07b-c5090deb3ab1	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-13 16:34:30.293997+05:45
66634799-d186-466b-8f80-b55a6861aaf9	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-13 16:35:15.766472+05:45
2956fffc-abf8-4a79-8734-0c000adc18a3	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-14 23:27:08.364948+05:45
eeb9e25b-c557-45c5-aa2b-0488f121d8bc	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-14 23:27:28.351625+05:45
b0ad0d25-d225-436a-9d75-59da85d1f02d	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-14 23:37:05.166117+05:45
bd7958dc-9682-4fe1-88f3-1fbd3280abd1	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-14 23:55:02.76912+05:45
d88faeb8-60da-429e-99d4-38e953ac47a2	11e156f0-797c-41c2-8322-5603e60a5fd8	REPORT_GENERATED	reports	1a2bc1d2-2a93-4ec6-98bf-6b807e8bb583	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-15 00:02:30.137656+05:45
882e1c86-6f11-4f5a-b8cf-bc8b19889dfe	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-15 00:16:05.618347+05:45
2370a7c5-a7c2-4171-99db-5917c8078ab3	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-15 00:16:06.200731+05:45
c9e55957-051d-4070-93a5-f3178df102aa	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-16 22:38:20.743075+05:45
6cbefd90-067e-48a4-be61-9e071e2ff8b6	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-16 22:40:29.297246+05:45
57a8b005-7bfd-4a4f-b4f2-5aa0ed09186c	11e156f0-797c-41c2-8322-5603e60a5fd8	REPORT_GENERATED	reports	775ce941-4b4d-428f-8434-7228633fb69b	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-16 22:41:52.915369+05:45
b0d7b40b-65ca-4332-9263-1c23b17af1c8	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-16 22:42:31.643093+05:45
dd1fdab6-7b48-4aca-94ed-52da4b9186de	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-16 22:43:15.350146+05:45
82806853-0019-439c-bad3-b6259cf03708	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-16 22:43:40.82373+05:45
00d535fe-454f-4170-8aa9-c0442b24ec87	11e156f0-797c-41c2-8322-5603e60a5fd8	NOMINEE_BATCH_CREATED	nominee_batch	4fda98c1-7d67-4333-b151-7afcbc30e9f6	\N	\N	\N	2026-08-16 22:45:20.987299+05:45
8ed33187-050e-4a54-87df-50a6fe4d19c6	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-16 22:45:37.183351+05:45
62972604-721b-48f6-89b6-83d7b117512d	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-16 22:45:47.732119+05:45
fba2d79a-44da-4af8-8bdd-6fc2410fccf6	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-16 22:45:55.339095+05:45
0be48d04-ee3a-440f-be24-9ba7072b76ba	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-16 22:56:25.504672+05:45
bd58aee9-0805-4fb7-8ad3-eb2cfc0ced40	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-16 22:56:27.948017+05:45
b7d649b0-a645-4457-b1a3-579da8718b49	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-16 22:57:52.871323+05:45
a674fbfc-8a64-4c8f-a178-8ff456db41e3	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-16 22:58:49.538+05:45
c60e5e12-1000-42be-a824-81a3032a8d26	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-16 23:06:43.390085+05:45
baaa9fff-8635-4d24-ac5b-2365ee135f43	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-16 23:07:51.141355+05:45
2928268a-5eba-478b-a92d-dfbd16a6ae57	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-16 23:23:54.339731+05:45
d0f84e5c-1e50-482e-b531-2bce41e454ae	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-16 23:25:55.319355+05:45
739ceff4-ec13-4646-89f9-62368501accb	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-16 23:35:08.590533+05:45
996ab378-2a91-46ca-bf43-605b9616af77	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-16 23:36:29.726686+05:45
0c330246-9923-4dcb-8806-36e9505e48d4	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-16 23:43:16.555202+05:45
35dcd39c-ab02-4a7d-a562-811dd9399a77	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-16 23:43:19.602987+05:45
e9f6c704-fb8d-4d2d-8f57-86299bff617c	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-16 23:44:26.277996+05:45
9bebd38a-b0ec-426a-9322-18888016213f	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-16 23:46:34.283758+05:45
7485d953-0aa8-4795-98f2-b37445eb2ca1	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-16 23:47:25.281655+05:45
d659804d-b5af-4151-b588-54b2ddc95bd4	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-16 23:48:35.322637+05:45
0ba42a6e-a588-47fc-97ae-41348c303d93	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-16 23:53:51.287403+05:45
f2100dc2-569e-4f90-90c6-c4dd587469e8	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-16 23:54:14.277002+05:45
ffb68ea0-4a64-4fa5-8754-665bdccb52c5	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-16 23:54:51.198693+05:45
74516d3e-422c-4100-a61f-cd6f9a389a2c	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-16 23:55:27.324949+05:45
48277882-1d38-4439-b4f3-064a9b6b75ff	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-16 23:55:47.649947+05:45
e3089b15-83a0-4ac9-bb18-9c4e2c37db1b	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-16 23:58:15.533358+05:45
1ad2345e-5175-4896-9b02-b989d19758d8	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-17 00:00:04.369009+05:45
582206a1-9561-4618-a0c6-18ebcf8d91f7	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-17 00:01:49.340726+05:45
c7f0e338-161f-4a28-b45a-ec67018bfd18	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-17 00:40:55.547988+05:45
6ee5edb5-a551-4654-b51e-b2dbf611f72b	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-17 00:40:58.150875+05:45
59ce8097-fce0-42d7-b8bb-498c79ccbe4b	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-17 00:44:06.879457+05:45
40461afa-fba4-4c89-bb00-0b4728423480	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-17 21:45:05.035903+05:45
667db5ae-e4d4-4117-8540-15697854ed6d	11e156f0-797c-41c2-8322-5603e60a5fd8	LOGOUT	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-17 21:45:06.986319+05:45
8e39fde5-9063-40b6-bdbe-e8af0a3b2ed0	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-17 21:45:41.967998+05:45
37c425ce-4f18-48a3-af4f-d56875aee41b	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-17 22:05:30.330796+05:45
6d9f5b22-1300-44f9-9baa-a8d5217abaf0	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-17 22:05:43.744083+05:45
e1b77ba1-25a4-4189-9ce4-db4ba2b0da2c	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-17 22:25:09.337122+05:45
d3def723-1f1c-41c3-babe-030b5667604c	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-17 22:25:11.754293+05:45
0e287528-2147-41ed-ac23-cbb24d9d24b2	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-17 22:52:38.499531+05:45
f8a45f89-f3cf-4455-8d0f-07cb980913d9	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-17 22:52:40.910418+05:45
1ea35bf4-8942-477b-8104-a897124b9eed	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-18 15:43:36.080357+05:45
016cd19a-2401-4e71-9b16-c3e349beaabf	11e156f0-797c-41c2-8322-5603e60a5fd8	LOGOUT	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-18 15:48:15.503027+05:45
8f638e5d-a4c5-4884-8530-99c003c3ff5e	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-18 15:50:32.382392+05:45
22fbaf37-7049-4a5a-9d87-96794bcd800f	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-18 15:51:37.730405+05:45
3d1636bd-47db-48cf-81eb-2372f04e63b3	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-18 16:31:21.923855+05:45
abc2fdde-4cc9-495c-b783-4a543aef6d30	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-18 16:36:36.614047+05:45
7040cbca-87fc-4bbd-b84c-cfa82b4b138e	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-18 16:54:58.418193+05:45
fe9e36f2-3fb2-4a83-8db8-a11212cd0143	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-18 16:55:48.030973+05:45
140c7520-2a9c-4d58-995f-d02b63d0b397	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-18 16:55:53.218734+05:45
401344e8-5504-4178-9954-740968997b11	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-18 16:57:39.36844+05:45
fd2348f2-3ac6-4952-a34a-9618a5b75c87	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-18 17:00:45.098129+05:45
17cd9627-95bd-4898-87bf-92235fa8139f	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-18 17:40:52.298373+05:45
009a0e62-7eb0-41d3-a13f-08d772476fc6	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-18 17:43:50.942892+05:45
a6961f19-5fa4-4ecb-8cf3-a50f7c53a6c2	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-18 17:43:52.348465+05:45
8d062ec5-2c7a-4dea-8860-8324a260d130	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-18 22:36:23.481938+05:45
12e651ab-6ce2-4f68-b332-45a358ad8824	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-18 22:36:26.164975+05:45
f326bd60-b9d4-424f-97eb-259612ab4861	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-18 22:46:47.120555+05:45
03f32537-1803-43fb-a46c-d7c6514ae40f	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-18 22:47:05.286176+05:45
336449c6-a78c-47d5-a648-65b03bc655e7	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-18 22:51:31.382442+05:45
b9d9274b-60fc-4e7d-a3bb-5f1de4cae79c	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-18 22:55:55.229008+05:45
7ea35adf-7c0f-426b-8b61-eabc94f0fc40	11e156f0-797c-41c2-8322-5603e60a5fd8	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "high", "creditScore": 760}	2026-08-18 22:57:35.418616+05:45
568a0ce0-aa00-436f-bacd-ce5bd7fe5dd7	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-18 22:59:05.964132+05:45
044dc13b-d13e-4a02-8019-43ffc67ce685	11e156f0-797c-41c2-8322-5603e60a5fd8	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "high", "creditScore": 760}	2026-08-18 23:00:12.552561+05:45
615568f0-8998-456d-83dc-5fbceda27fce	11e156f0-797c-41c2-8322-5603e60a5fd8	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "high", "creditScore": 760}	2026-08-18 23:01:13.26669+05:45
272c1479-764e-402e-a2bd-62b925665431	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-18 23:01:57.090925+05:45
6b4a7c7e-7435-463f-822d-c0b3611ad900	11e156f0-797c-41c2-8322-5603e60a5fd8	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "high", "creditScore": 760}	2026-08-18 23:01:58.248449+05:45
e307af2c-8f71-41de-b5f9-3ad15c87fa4e	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-18 23:05:39.379901+05:45
91fb353e-791e-4da6-acf4-1e7c10659c48	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-18 23:15:54.533082+05:45
6e502ae9-9aed-41cb-97e0-00afc695d9ec	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-18 23:16:01.44752+05:45
88f4ba33-7d4b-4d52-9ca2-ac434b078e96	11e156f0-797c-41c2-8322-5603e60a5fd8	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "high", "creditScore": 760}	2026-08-18 23:16:19.794676+05:45
adf30c42-59e0-45cd-88b3-0f8ccf3d990b	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-18 23:17:17.345176+05:45
fca9c282-36a5-4e21-8642-e657da6d5140	11e156f0-797c-41c2-8322-5603e60a5fd8	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "high", "creditScore": 760}	2026-08-18 23:17:18.188363+05:45
4c94672c-2f15-47a6-903e-c6af791f2100	11e156f0-797c-41c2-8322-5603e60a5fd8	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "high", "creditScore": 760}	2026-08-18 23:17:27.440502+05:45
8df7652e-2517-48ab-8aab-bf4fc0a80b4c	11e156f0-797c-41c2-8322-5603e60a5fd8	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "high", "creditScore": 760}	2026-08-18 23:17:36.495635+05:45
2a5317b3-3c80-4e6c-b992-5ea1b5f1626f	11e156f0-797c-41c2-8322-5603e60a5fd8	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "high", "creditScore": 760}	2026-08-18 23:18:03.672601+05:45
3c37b1b2-beab-4c30-961f-df46a4e8e2b4	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-18 23:23:51.356673+05:45
f2b93fc0-571a-4e6f-871e-d52d83b53660	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-18 23:24:52.917635+05:45
78c2a917-f531-4f88-a06d-81c503ec6705	11e156f0-797c-41c2-8322-5603e60a5fd8	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "high", "creditScore": 760}	2026-08-18 23:25:11.954995+05:45
4f47cffb-be28-449f-9457-734d42805949	11e156f0-797c-41c2-8322-5603e60a5fd8	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "high", "creditScore": 760}	2026-08-18 23:25:22.225088+05:45
12ccc0c5-9621-4d33-9a6c-e7897ab4a731	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-18 23:33:00.670486+05:45
c54def1a-2015-405c-b16a-acc94aea58a1	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-18 23:33:32.899539+05:45
7bbf32c5-5243-4b47-9afa-043c074044e8	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-18 23:37:18.58055+05:45
c8de2661-7886-4f65-8745-dde6560b74e2	11e156f0-797c-41c2-8322-5603e60a5fd8	INSURANCE_GAP_ANALYSED	insurance_gap_analysis	\N	\N	\N	{"gapScore": 0, "severity": "critical"}	2026-08-18 23:44:16.33821+05:45
5c611f29-1544-40b1-b6b5-7e12f211c4da	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-18 23:52:05.508304+05:45
872ae33a-83bd-4f7c-8a1d-cecf14004fa9	11e156f0-797c-41c2-8322-5603e60a5fd8	INSURANCE_GAP_ANALYSED	insurance_gap_analysis	\N	\N	\N	{"gapScore": 0, "severity": "critical"}	2026-08-18 23:52:07.245963+05:45
d6f47ed2-b7ac-42f5-8170-3a9bc81b9d56	11e156f0-797c-41c2-8322-5603e60a5fd8	INSURANCE_GAP_ANALYSED	insurance_gap_analysis	\N	\N	\N	{"gapScore": 0, "severity": "critical"}	2026-08-19 00:01:32.234271+05:45
043e85a3-d1ef-43c8-9fbc-33de90fb55c9	11e156f0-797c-41c2-8322-5603e60a5fd8	INSURANCE_GAP_ANALYSED	insurance_gap_analysis	\N	\N	\N	{"gapScore": 0, "severity": "critical"}	2026-08-19 00:01:51.732841+05:45
100a6efd-d38f-44cc-80c3-91b5ed62bee2	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-19 00:03:57.575332+05:45
944e2e54-ad7e-43a4-8913-2a89da3da42f	11e156f0-797c-41c2-8322-5603e60a5fd8	INSURANCE_GAP_ANALYSED	insurance_gap_analysis	\N	\N	\N	{"gapScore": 0, "severity": "critical"}	2026-08-19 00:03:58.374073+05:45
f3eceb77-66b4-40de-99a9-9510bca1477a	4364b6ac-3743-48b8-a526-1146530078a1	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "low", "creditScore": 620}	2026-08-23 01:13:34.988978+05:45
a82317fd-7f92-4b2f-9d1e-98c9aa690faa	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-19 00:46:09.479443+05:45
0b19a7a0-b478-48e6-b0bc-eba40617db63	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-19 00:46:27.361218+05:45
da02c216-ae2c-4e22-a11e-fea432780612	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-19 00:46:56.484102+05:45
13258eaf-b40d-4870-a2c7-2dea7ee6c66a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-19 00:51:11.668349+05:45
78e8d7e4-b4e5-4d47-851b-bdfee139ef36	11e156f0-797c-41c2-8322-5603e60a5fd8	LAND_SEARCH	ancestral_search	6c16c0ad-1d30-4c21-831c-9590523e4ff9	\N	\N	{"state": "rajasthan", "ancestorName": "Nitesh"}	2026-08-19 01:04:45.862291+05:45
d19c136b-2fde-49f5-ba57-04487187daef	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-19 01:08:05.864991+05:45
d998053c-c8ce-41a4-a987-1dae63438f16	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-19 01:08:08.273132+05:45
ebafe379-621b-4bde-af5e-466abb2e7234	11e156f0-797c-41c2-8322-5603e60a5fd8	LAND_SEARCH	ancestral_search	85027373-f271-4a2a-a925-687069eae110	\N	\N	{"state": "rajasthan", "ancestorName": "Nitesh"}	2026-08-19 01:09:06.868142+05:45
4d32e944-2ad1-453a-a393-b8fe692a7bf0	11e156f0-797c-41c2-8322-5603e60a5fd8	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "high", "creditScore": 760}	2026-08-19 01:16:25.691715+05:45
b365cb35-e489-4c8a-a549-2ca4ff423a60	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-19 01:16:45.449468+05:45
5b9bcc89-52f6-47b1-a34d-e15dde71df78	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-19 01:16:52.434407+05:45
037829b3-02a6-4d9c-a849-d4b4b3103620	11e156f0-797c-41c2-8322-5603e60a5fd8	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "high", "creditScore": 760}	2026-08-19 01:16:55.276934+05:45
e4d2dbfe-00ea-4e81-af12-6786bd408b90	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-19 16:29:39.878492+05:45
085fe1c9-8505-4be6-ba7d-2eecc12bf164	11e156f0-797c-41c2-8322-5603e60a5fd8	LOGOUT	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-19 16:29:48.991514+05:45
85ab0ee9-25fb-4e7c-b335-9d00f1e449b8	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-19 16:30:07.183768+05:45
26f3873a-01be-4f6f-802e-572a0442fbe7	11e156f0-797c-41c2-8322-5603e60a5fd8	REPORT_GENERATED	reports	cdc70b8a-b962-4cc5-b6ea-b258b3243e5a	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-19 16:30:18.803627+05:45
81243c53-4c0b-42e7-9c15-f21d4e670b19	11e156f0-797c-41c2-8322-5603e60a5fd8	REPORT_GENERATED	reports	f5dd3fe7-ef8c-439e-94c4-d7eb0470d066	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-19 16:34:32.374124+05:45
5fd630aa-63ac-4965-83b3-37c4069f84ce	11e156f0-797c-41c2-8322-5603e60a5fd8	REPORT_GENERATED	reports	21fd5cd3-b6d6-4079-8959-d45f704221be	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-19 16:35:42.237328+05:45
fece3310-88a6-4322-ab1f-e6ecce791645	11e156f0-797c-41c2-8322-5603e60a5fd8	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "high", "creditScore": 760}	2026-08-19 16:41:23.864438+05:45
d6bbb996-a2a5-4f4b-a50b-930326397c04	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-19 16:41:34.064085+05:45
c110f9d7-6f70-478e-a863-6356b9fdc529	11e156f0-797c-41c2-8322-5603e60a5fd8	INSURANCE_GAP_ANALYSED	insurance_gap_analysis	\N	\N	\N	{"gapScore": 0, "severity": "critical"}	2026-08-19 16:41:48.542863+05:45
74a185e9-7d3a-496a-af63-b74a93d708b4	11e156f0-797c-41c2-8322-5603e60a5fd8	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "high", "creditScore": 760}	2026-08-19 16:41:54.338954+05:45
dedf0b47-f2c8-4eea-a7a0-8652d8006473	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-19 16:42:03.846978+05:45
feb02c75-bc2c-48df-8ed6-eda4426d21c7	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-19 16:52:43.256106+05:45
85088833-9f96-44ff-a34a-46d6f7e8c9aa	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-19 16:53:51.255774+05:45
e2bd77a1-e751-4a40-b07d-087a55f78811	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-19 17:01:13.85251+05:45
ad8a57d8-65cc-4999-8ce0-fa8b784fe260	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-19 17:02:57.319053+05:45
6c79d6c7-f28c-465b-9c54-9c0e0f080e5a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-19 17:03:27.001623+05:45
518edf7c-3731-4077-8ced-35207bbf106d	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-19 17:03:44.607488+05:45
9d397459-3f1e-44a0-9b6b-d080225d97ec	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-19 17:03:48.022176+05:45
815f8297-00e4-4cff-84eb-c43fd4d9c916	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-19 17:05:49.470675+05:45
708eef2e-c163-4cf5-bd22-17f6a8cd45d7	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-19 17:07:36.209262+05:45
6fe2143f-62c4-4482-97fa-6600ea9e989a	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-19 17:09:57.329462+05:45
0b48b3dd-389f-41b2-9b0d-f19953887d23	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-19 17:10:00.03619+05:45
7507a70f-d00f-490f-bc88-b4b91ca7638f	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-19 17:12:43.037867+05:45
d027fa51-5416-4f84-bb10-ed3e614f1756	11e156f0-797c-41c2-8322-5603e60a5fd8	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "high", "creditScore": 760}	2026-08-19 17:13:46.629456+05:45
890de11b-6a11-4c0c-b7be-d88e9f49e856	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-19 17:14:16.616089+05:45
f80c93e3-2f43-433a-93ff-d679bb07e8f0	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-19 17:18:00.674021+05:45
9bfb03f0-5efe-4897-8a56-11ec6923e576	11e156f0-797c-41c2-8322-5603e60a5fd8	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "high", "creditScore": 760}	2026-08-19 17:18:02.151572+05:45
9ed8914e-9156-4f3f-8c20-dee2a133cd2c	11e156f0-797c-41c2-8322-5603e60a5fd8	INSURANCE_GAP_ANALYSED	insurance_gap_analysis	\N	\N	\N	{"gapScore": 0, "severity": "critical"}	2026-08-19 17:22:16.490295+05:45
d12ff57d-99c8-4f32-a228-ed48e57f6b36	11e156f0-797c-41c2-8322-5603e60a5fd8	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "high", "creditScore": 760}	2026-08-19 17:22:45.511081+05:45
9957b699-faa3-4f79-86d6-e6295f56cb85	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-19 17:29:55.126203+05:45
0dfaffa5-0cdf-4fdd-9af3-fd327b362d53	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-19 17:37:28.734889+05:45
02c0c2d6-dbf4-4cc8-a921-2afbbecf36d7	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-19 17:39:43.620248+05:45
824c6f90-edc0-4c4f-b295-765af4ca9e02	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-19 17:51:35.338801+05:45
fe3074a7-833e-4f11-a866-527bc57354b6	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-19 17:57:10.388945+05:45
4b250a92-201b-43a4-94f9-1f768e56fe87	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-20 19:43:17.733427+05:45
c084420e-2a25-4c12-bc9a-7b39fad8516a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-20 19:44:10.957345+05:45
c5e153a1-b3e5-41de-a48e-226a5ba87689	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-20 19:44:15.204057+05:45
8b07ae8f-e7c3-4cae-8f00-eff64dadc934	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-20 19:44:31.181301+05:45
d343a31f-8720-460a-8dfc-a8b10b2897d9	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-20 19:46:24.080973+05:45
05946ecd-5440-4abb-ba78-a3ba64430a2f	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-20 20:01:11.063441+05:45
79361a7b-76c8-456c-a111-116366455941	11e156f0-797c-41c2-8322-5603e60a5fd8	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "high", "creditScore": 760}	2026-08-20 20:01:11.790429+05:45
ff698f74-7818-44c5-bb0b-3c561dba2854	11e156f0-797c-41c2-8322-5603e60a5fd8	INSURANCE_GAP_ANALYSED	insurance_gap_analysis	\N	\N	\N	{"gapScore": 0, "severity": "critical"}	2026-08-20 20:01:16.412252+05:45
758a1c3c-52a3-462b-9393-4c22d4375adc	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-20 20:35:26.536176+05:45
350a8640-f7c9-409f-bbc6-3ae0be5ddd7f	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-20 21:42:34.616688+05:45
4c74c3e2-f97f-43f1-b577-36b0b3927805	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-20 21:44:37.73005+05:45
2a013aa1-098b-4ed0-a73c-e9e5f3b5e387	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-20 21:44:47.953613+05:45
759bbd27-7568-45de-876b-96348acc6968	11e156f0-797c-41c2-8322-5603e60a5fd8	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "high", "creditScore": 760}	2026-08-20 21:45:31.506404+05:45
8839419e-4c44-4df8-94c3-0787c550cb61	11e156f0-797c-41c2-8322-5603e60a5fd8	INSURANCE_GAP_ANALYSED	insurance_gap_analysis	\N	\N	\N	{"gapScore": 0, "severity": "critical"}	2026-08-20 21:45:42.988189+05:45
0954ce92-213d-4e22-94d5-9c02b1086da8	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-20 21:46:44.258831+05:45
5a01013b-8491-4971-8dfd-d01c7e191fe2	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-20 21:47:06.753095+05:45
4aec9712-65c3-4dd3-a7dd-16ccc46d97de	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-20 21:48:20.018508+05:45
1a147161-4c65-4df9-8490-78a4c7777e07	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-20 21:48:27.971619+05:45
57b639de-ff91-4b0b-9b21-626c6447f156	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-20 22:04:25.968241+05:45
a2dfe498-61ca-466b-ae87-2cb36c4a7f91	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-20 22:04:44.397877+05:45
8d4cfd05-0234-4690-aa51-dd1f56836ab0	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-20 22:04:53.788952+05:45
d0a49455-02b8-4645-b2fd-7f6c5d98e7fd	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-20 22:08:27.605606+05:45
90021f2e-2425-4d49-9f55-4fa4a1ab66cd	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-20 22:25:25.728892+05:45
ab508c64-8d5d-4ff4-a0cf-92e48cd05162	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-20 22:44:14.540768+05:45
44b084af-47d3-46d3-bc90-8716744e2c35	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-20 22:47:25.240416+05:45
79c7274b-2452-4b43-80aa-3f46a17451d2	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-20 23:02:56.715318+05:45
d4e5b49c-513e-4768-bfa8-0beb51e0f630	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-20 23:18:00.221203+05:45
dd5f98da-cce7-4ad9-bed2-9b8dcc2eb9c1	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-20 23:27:47.041026+05:45
bb09a346-5eb4-48c8-ab63-fad07560ba44	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-20 23:27:53.162574+05:45
2c696e70-759d-4e24-a3e5-c5e566295e2d	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-20 23:27:59.611135+05:45
1ca77c0d-40e0-4dfb-b1ab-0dc76a01bf40	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-20 23:28:03.182287+05:45
4e56c42a-3dca-4e82-a292-5fc9982dc105	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-20 23:28:13.420199+05:45
e8c6955d-2bfe-4bdf-abb4-998927e30423	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-20 23:28:35.496023+05:45
f6f7d5e0-cf0e-4331-80cb-61522017ef10	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-20 23:33:41.814927+05:45
701dd248-a748-4b60-99b3-0ba5216bc98d	320834dc-9fb9-44da-a845-c0faf7647d59	INSURANCE_GAP_ANALYSED	insurance_gap_analysis	\N	\N	\N	{"gapScore": 75, "severity": "low"}	2026-08-23 01:13:35.075225+05:45
bd68d77e-f57f-44db-9fa0-7f4ec00e7ee7	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-20 23:35:21.02638+05:45
e8e7441f-9444-4cb4-8402-8fc3a701c1d9	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-20 23:35:26.83694+05:45
8d3a8f02-2cc6-4fac-97d5-7b1ff37e23e9	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-20 23:40:21.339122+05:45
22db5299-811d-4211-b4de-0d071f5234a4	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-20 23:40:28.197534+05:45
8591a641-33de-4438-beea-844a46952c18	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-20 23:40:40.141543+05:45
8af2c89f-62d2-4c36-b511-3b74d5dd4247	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-20 23:40:46.95339+05:45
1de951c7-d4cb-4ef9-adf6-44fde0bb141f	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-20 23:40:50.762227+05:45
7f4ba8de-d46b-48c7-83e0-e569792a1b9a	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-20 23:48:49.680075+05:45
fdcaffae-311d-4321-bd27-2bbcbfb9b5a0	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-20 23:53:28.401694+05:45
c189175b-2655-4ddf-ab2e-df74058eab99	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-20 23:53:31.384485+05:45
c62122b0-af8f-4456-bee9-0ba2a79c4a00	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-20 23:59:31.308309+05:45
d309d89d-f6de-4709-bc04-f9f478b4c47f	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-20 23:59:34.341582+05:45
dbdd14ea-2591-48fd-8522-7e7bcdc6c829	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-20 23:59:48.933307+05:45
51028e6f-1e72-4aa4-b731-3c99a6627dc2	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-21 15:26:10.378583+05:45
7ed9ff25-d58b-499b-8343-7e70cec0bcb8	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-21 19:06:44.388702+05:45
70a91ef9-7a26-4d01-ba1f-58e7ba4cf6a7	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-21 19:32:11.449102+05:45
f71a0f02-6d02-4a64-b9c0-00603415fecc	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-21 19:32:19.196825+05:45
0f76522d-d8a5-4a00-b62c-28b6cf76942a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-22 00:07:24.141343+05:45
787353b3-a6d2-4632-9ae6-5a6aeae19bb2	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-22 23:33:00.530953+05:45
ab75568b-bb35-45c4-a104-cd88245174fe	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-22 23:34:36.434637+05:45
eb5a1101-4cc4-4d58-ad5b-464018d205fe	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-22 23:52:07.661321+05:45
c71c60bc-7f9f-4887-a854-7877b2951798	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 00:36:24.028495+05:45
65b55697-500c-42e5-991b-20cf190855f0	11e156f0-797c-41c2-8322-5603e60a5fd8	LOGOUT	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 00:36:25.7014+05:45
b99bca5a-869a-4487-90b0-1de3cec1d143	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 00:38:48.401346+05:45
0aacacea-f1bc-40cb-b013-fbf012d99927	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 00:54:02.272198+05:45
13ea3d48-6a8f-4950-bfe4-af10542380a1	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 00:58:28.192347+05:45
5478d645-9511-445b-a897-2a778bfbc65a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 00:59:30.842085+05:45
a73c2207-9322-45e7-a086-1fed22ac1bac	ec15c032-c607-4598-9121-bda207603215	LOGIN	users	ec15c032-c607-4598-9121-bda207603215	127.0.0.1	Audit-Test-Agent/1.0	{"method": "phone_otp"}	2026-08-23 01:06:15.215749+05:45
01e15b71-9811-430c-b7a2-1b3c4357b10d	ec15c032-c607-4598-9121-bda207603215	PHONE_VERIFIED	auth	\N	127.0.0.1	\N	\N	2026-08-23 01:06:15.236187+05:45
09f1e1a6-46e6-4f1d-aa27-5df880ee618e	f951c4dc-6066-4eeb-a374-891be86b73bf	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "high", "creditScore": 780}	2026-08-23 01:06:15.571386+05:45
b96ae841-e4df-44db-9bfa-2738ff661e83	f951c4dc-6066-4eeb-a374-891be86b73bf	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "low", "creditScore": 620}	2026-08-23 01:06:15.581296+05:45
4e0e3ad6-675b-4af4-a5bb-0550ad960c25	ee273ba2-04c9-4cc3-91ee-9c4610b0e8b5	LOGIN	users	ee273ba2-04c9-4cc3-91ee-9c4610b0e8b5	127.0.0.1	Audit-Test-Agent/1.0	{"method": "phone_otp"}	2026-08-23 01:07:17.574693+05:45
3af1a872-c092-464e-86bf-95b60da52ed6	ee273ba2-04c9-4cc3-91ee-9c4610b0e8b5	PHONE_VERIFIED	auth	\N	127.0.0.1	\N	\N	2026-08-23 01:07:17.591082+05:45
037ac475-942c-4178-af8a-9ea1f80fced6	ee273ba2-04c9-4cc3-91ee-9c4610b0e8b5	CONSENT_CREATED	consents	05242e6d-8e30-4e19-b237-ee1e0ec2133a	127.0.0.1	\N	\N	2026-08-23 01:07:17.59571+05:45
433ff7d3-f8a7-4fae-b949-9d23bd04e0a3	b23017a8-5f0e-4b54-ad5c-3f9aeced4b83	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "high", "creditScore": 780}	2026-08-23 01:07:17.630231+05:45
fd1e778d-cb50-4f93-b4cc-7acf7857db9f	b23017a8-5f0e-4b54-ad5c-3f9aeced4b83	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "low", "creditScore": 620}	2026-08-23 01:07:17.637237+05:45
bd1ed765-9f8f-4bda-928b-cc8e1be89e9e	960f0a14-12fc-42d7-9bab-f66d16468633	LOGIN	users	960f0a14-12fc-42d7-9bab-f66d16468633	127.0.0.1	Audit-Test-Agent/1.0	{"method": "phone_otp"}	2026-08-23 01:07:56.041248+05:45
35efbc12-063c-4fe1-9591-6e423933cd6e	960f0a14-12fc-42d7-9bab-f66d16468633	PHONE_VERIFIED	auth	\N	127.0.0.1	\N	\N	2026-08-23 01:07:56.060224+05:45
b4ffc85a-2527-4199-ac5a-0dfefdfc715d	960f0a14-12fc-42d7-9bab-f66d16468633	CONSENT_CREATED	consents	6c64f000-1917-4647-92b3-0a18bb0e4b19	127.0.0.1	\N	\N	2026-08-23 01:07:56.065646+05:45
94937ec1-30df-4c69-b3cc-11abd904d2d2	31fc6079-e5cd-4e02-8b89-a26a28edf9cb	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "high", "creditScore": 780}	2026-08-23 01:07:56.101127+05:45
073677a4-a4e5-4d77-b259-763112b828cf	31fc6079-e5cd-4e02-8b89-a26a28edf9cb	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "low", "creditScore": 620}	2026-08-23 01:07:56.107517+05:45
6446663f-13c5-4e2f-bb22-24f9ec06b099	1da51798-989b-4204-b4de-530ad2350d1d	LOGIN	users	1da51798-989b-4204-b4de-530ad2350d1d	127.0.0.1	Audit-Test-Agent/1.0	{"method": "phone_otp"}	2026-08-23 01:08:28.683307+05:45
8744fe62-1d2e-4115-9108-27359bd1571d	1da51798-989b-4204-b4de-530ad2350d1d	PHONE_VERIFIED	auth	\N	127.0.0.1	\N	\N	2026-08-23 01:08:28.700114+05:45
ef4f8aa5-b431-45b9-bf05-bfdbdcdd431f	1da51798-989b-4204-b4de-530ad2350d1d	CONSENT_CREATED	consents	611d1cec-7c0a-4f2b-837b-cc8a230e34b5	127.0.0.1	\N	\N	2026-08-23 01:08:28.704767+05:45
fdf3c6b1-2af1-43c8-b0aa-d1e37519ce69	38b575ef-3220-42fb-8d4d-8dcf15ecab3b	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "high", "creditScore": 780}	2026-08-23 01:08:28.739094+05:45
a5f7e55c-bd0e-4792-bfb4-0944869383cb	bdf2c995-d666-4323-83b9-d5005771f08f	CONSENT_CREATED	consents	3e145c70-c2dc-4e59-9950-58808afd955c	127.0.0.1	\N	\N	2026-08-23 01:14:34.689778+05:45
f988be31-e689-48bc-b32d-6e62251613a6	98d4ed24-9384-474f-a37f-04fa8cd6314b	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "high", "creditScore": 780}	2026-08-23 01:14:34.722222+05:45
a8ea43e0-8cbd-44a8-83d1-ab2943b5528d	98d4ed24-9384-474f-a37f-04fa8cd6314b	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "low", "creditScore": 620}	2026-08-23 01:14:34.729076+05:45
af8c9464-32b3-494b-b93e-477634d8f247	b1c16aa1-6cc5-45e0-82a7-5a0a6de66bda	INSURANCE_GAP_ANALYSED	insurance_gap_analysis	\N	\N	\N	{"gapScore": 75, "severity": "low"}	2026-08-23 01:14:34.791884+05:45
a2158ab5-e3ff-4ba1-b207-ed0f8391f9bf	3a1ac46d-e6c8-4f6e-984f-ac2bf44c082e	LOGIN	users	3a1ac46d-e6c8-4f6e-984f-ac2bf44c082e	127.0.0.1	Audit-Test-Agent/1.0	{"method": "phone_otp"}	2026-08-23 01:15:39.054411+05:45
236f2987-0891-44d3-a969-6925dabde6a1	3a1ac46d-e6c8-4f6e-984f-ac2bf44c082e	PHONE_VERIFIED	auth	\N	127.0.0.1	\N	\N	2026-08-23 01:15:39.070267+05:45
e9ab66ef-17f5-4637-a969-035c357fcc2e	3a1ac46d-e6c8-4f6e-984f-ac2bf44c082e	CONSENT_CREATED	consents	ba7c233d-f93c-468a-89d9-47159d280efc	127.0.0.1	\N	\N	2026-08-23 01:15:39.075453+05:45
76b7b9bb-e684-46d6-aae1-68c5806fac75	4c60edee-edb8-4c83-a080-780ab1218c2c	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "high", "creditScore": 780}	2026-08-23 01:15:39.104576+05:45
848441ba-0a3b-4da7-8445-9a9667680d46	4c60edee-edb8-4c83-a080-780ab1218c2c	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "low", "creditScore": 620}	2026-08-23 01:15:39.111237+05:45
d29210ba-b86e-4d38-aaa7-41cb2ae0b341	3910620a-1af0-464d-a449-1722de3647c0	INSURANCE_GAP_ANALYSED	insurance_gap_analysis	\N	\N	\N	{"gapScore": 75, "severity": "low"}	2026-08-23 01:15:39.172123+05:45
1d941a83-1655-4743-8ffe-c1c26f7cd50f	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 01:16:10.351999+05:45
96eba2d4-c107-4495-b34e-4b122f01f5e0	b874aa5d-199c-4913-8640-e9673c3947df	LOGIN	users	b874aa5d-199c-4913-8640-e9673c3947df	127.0.0.1	Audit-Test-Agent/1.0	{"method": "phone_otp"}	2026-08-23 01:16:11.676155+05:45
725ef725-472a-46ff-9b7c-9b522573b068	b874aa5d-199c-4913-8640-e9673c3947df	PHONE_VERIFIED	auth	\N	127.0.0.1	\N	\N	2026-08-23 01:16:11.692361+05:45
a26a76bb-eef9-4342-bb9d-bdcabcfbc9d6	b874aa5d-199c-4913-8640-e9673c3947df	CONSENT_CREATED	consents	497c5013-d098-478a-b261-f6d24d5546fd	127.0.0.1	\N	\N	2026-08-23 01:16:11.697725+05:45
7d52bcf4-b682-4b08-8b4c-5e2ca31ab8f3	19075e73-6251-4475-a5e8-f55c78d8472e	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "high", "creditScore": 780}	2026-08-23 01:16:11.727041+05:45
11edde6d-4ad5-486a-bc66-34422a18115c	19075e73-6251-4475-a5e8-f55c78d8472e	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "low", "creditScore": 620}	2026-08-23 01:16:11.734104+05:45
56664c96-5911-428d-9ef9-3b6e1ee3315e	e9b31d99-1410-41c5-a063-fbcffcab2fc8	INSURANCE_GAP_ANALYSED	insurance_gap_analysis	\N	\N	\N	{"gapScore": 75, "severity": "low"}	2026-08-23 01:16:11.797716+05:45
16c66691-d7aa-4ce8-9d28-337d4352d46f	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 01:16:27.87637+05:45
a541dcec-52dd-4af4-9027-bb0d7f35c3f0	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 01:16:37.641091+05:45
c29ce5c4-943d-437c-aab7-7afff6cc6a01	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 01:17:56.044959+05:45
1a4430e2-d565-4b50-b877-1a03cc559f3a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 01:18:28.350011+05:45
71c2b124-27b1-47a9-8a78-57c95f5b63b0	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 01:19:38.851429+05:45
a306dd4e-5cf1-4356-9abe-86007acd222a	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 01:21:26.11203+05:45
2a2afb04-b369-48d6-a365-6dd21ca035d0	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 01:22:42.625011+05:45
777b251e-e32d-4e5b-ae1a-9165401de290	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 01:24:50.846609+05:45
f5513fb3-e4b4-48a5-8960-92920d0f9ebe	844d8942-fb16-4ceb-9ab1-756af963f087	LOGIN	users	844d8942-fb16-4ceb-9ab1-756af963f087	127.0.0.1	Audit-Test-Agent/1.0	{"method": "phone_otp"}	2026-08-23 01:27:12.200661+05:45
1cee3563-a2ae-4a82-b5e7-11df4c08ffb0	844d8942-fb16-4ceb-9ab1-756af963f087	PHONE_VERIFIED	auth	\N	127.0.0.1	\N	\N	2026-08-23 01:27:12.216621+05:45
f18a5e06-009e-45d8-8c50-ea05ef6b7ba7	844d8942-fb16-4ceb-9ab1-756af963f087	CONSENT_CREATED	consents	e18000d8-d0f6-4c4a-8026-bb6dd286fd1c	127.0.0.1	\N	\N	2026-08-23 01:27:12.221274+05:45
dfcc9da2-e443-46cc-8af6-6bb8fff57d4f	fa30b54c-534a-4e8b-982e-15d56fe3993d	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "high", "creditScore": 780}	2026-08-23 01:27:12.253575+05:45
918e6550-6e4b-47ed-aea2-c8fa346ea7d2	fa30b54c-534a-4e8b-982e-15d56fe3993d	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "low", "creditScore": 620}	2026-08-23 01:27:12.260142+05:45
3c31d4ea-7847-463b-89e3-6184ea6e1ee0	ffab1141-5379-4c66-b674-f4dee33025c1	INSURANCE_GAP_ANALYSED	insurance_gap_analysis	\N	\N	\N	{"gapScore": 75, "severity": "low"}	2026-08-23 01:27:12.322206+05:45
861b8da4-f7c7-407c-bef3-eefe3150af86	11e156f0-797c-41c2-8322-5603e60a5fd8	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "high", "creditScore": 760}	2026-08-23 01:28:47.086893+05:45
feabacf4-f05c-4364-bee1-3e9f54ef9f46	11e156f0-797c-41c2-8322-5603e60a5fd8	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "high", "creditScore": 760}	2026-08-23 01:29:23.01766+05:45
bd8d4273-f8f7-446c-9990-a06585601daf	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 01:31:53.004241+05:45
e6be5fe8-1cec-4c52-a007-4a51a41532db	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 01:31:59.147822+05:45
ec24ddc8-2305-40ea-a58a-e25e1e80f0c0	72276b9d-c6d8-4588-818a-93cd4cdfb7ee	LOGIN	users	72276b9d-c6d8-4588-818a-93cd4cdfb7ee	127.0.0.1	Audit-Test-Agent/1.0	{"method": "phone_otp"}	2026-08-23 01:34:00.856117+05:45
e40baa4b-badb-4606-b0b8-de230324e159	72276b9d-c6d8-4588-818a-93cd4cdfb7ee	PHONE_VERIFIED	auth	\N	127.0.0.1	\N	\N	2026-08-23 01:34:00.876045+05:45
b7358b3f-f34c-4f67-ae13-df659d9069f8	72276b9d-c6d8-4588-818a-93cd4cdfb7ee	CONSENT_CREATED	consents	f7620618-2b4a-42ef-9801-72a580bf565a	127.0.0.1	\N	\N	2026-08-23 01:34:00.881037+05:45
21fbb8d6-58ae-43d9-888d-7ed160f72506	64f9d62f-8b32-4c52-88db-58b2d0484f26	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "high", "creditScore": 780}	2026-08-23 01:34:00.913172+05:45
40d3641a-8409-4345-bfbf-9afdbf373819	64f9d62f-8b32-4c52-88db-58b2d0484f26	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "low", "creditScore": 620}	2026-08-23 01:34:00.919768+05:45
1a1b994f-26c0-413a-afcd-832cc696e181	dbe4dea0-e811-4e7e-af9b-f74aca667441	INSURANCE_GAP_ANALYSED	insurance_gap_analysis	\N	\N	\N	{"gapScore": 75, "severity": "low"}	2026-08-23 01:34:00.991048+05:45
0ad647a6-7fa4-46f4-9d8c-52957b8a55c2	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 01:35:19.147673+05:45
461b5923-062f-4ece-9cdd-cd387971c2fa	b9691ce8-d098-48b4-9969-d4d8ff07344d	LOGIN	users	b9691ce8-d098-48b4-9969-d4d8ff07344d	127.0.0.1	Audit-Test-Agent/1.0	{"method": "phone_otp"}	2026-08-23 01:36:01.217973+05:45
d31d301d-68d6-44c9-bafb-54215fd1f6c7	b9691ce8-d098-48b4-9969-d4d8ff07344d	PHONE_VERIFIED	auth	\N	127.0.0.1	\N	\N	2026-08-23 01:36:01.234704+05:45
dffe0435-0a76-4002-921a-13e1e99ae300	b9691ce8-d098-48b4-9969-d4d8ff07344d	CONSENT_CREATED	consents	6278e707-0af3-4e3c-a00b-2a7f4bd096ed	127.0.0.1	\N	\N	2026-08-23 01:36:01.238481+05:45
d2efb74e-b19b-4af8-9b5f-29701fcfbe95	a50afb79-e294-433f-94fc-1c3d8e6e6889	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "high", "creditScore": 780}	2026-08-23 01:36:01.275353+05:45
b419f031-dce7-49e3-b77f-bced7076a390	a50afb79-e294-433f-94fc-1c3d8e6e6889	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "low", "creditScore": 620}	2026-08-23 01:36:01.282267+05:45
cf1b5a4c-6a23-4086-a95d-d71f2437f428	f53430c9-c8ee-49b9-a38b-a97c5c47c4e4	INSURANCE_GAP_ANALYSED	insurance_gap_analysis	\N	\N	\N	{"gapScore": 75, "severity": "low"}	2026-08-23 01:36:01.345662+05:45
d3cc1fd6-0b27-4b14-92cd-dd34a3d27d41	13a3bd8a-e74d-45b6-a9f7-ef053c62d2da	LOGIN	users	13a3bd8a-e74d-45b6-a9f7-ef053c62d2da	127.0.0.1	Audit-Test-Agent/1.0	{"method": "phone_otp"}	2026-08-23 01:39:04.148225+05:45
aa67da6a-3e10-4e1c-8332-b9962b76d80a	13a3bd8a-e74d-45b6-a9f7-ef053c62d2da	PHONE_VERIFIED	auth	\N	127.0.0.1	\N	\N	2026-08-23 01:39:04.163529+05:45
1e7fbf80-28f2-4eb5-b483-5a4f396ec3b2	13a3bd8a-e74d-45b6-a9f7-ef053c62d2da	CONSENT_CREATED	consents	ec48f1c4-7008-4bff-8707-46c0fc4941c6	127.0.0.1	\N	\N	2026-08-23 01:39:04.167578+05:45
3ccfbc36-db5a-4b34-bed2-aa596aa3d762	5656bd0f-6952-4f7d-86ab-0e907aa380f9	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "high", "creditScore": 780}	2026-08-23 01:39:04.204027+05:45
6db9581d-1003-42d8-8d7c-f765aeccaa76	5656bd0f-6952-4f7d-86ab-0e907aa380f9	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "low", "creditScore": 620}	2026-08-23 01:39:04.21154+05:45
09364ea6-55bb-4732-993b-1113ca59a50a	f08f4ece-40c4-445b-964d-112da62ba366	INSURANCE_GAP_ANALYSED	insurance_gap_analysis	\N	\N	\N	{"gapScore": 75, "severity": "low"}	2026-08-23 01:39:04.27237+05:45
a8c5e0bc-f41f-4cd7-90a1-25e1891f3ef3	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 01:41:05.37541+05:45
3fc9e7d8-c0f1-4a02-ad8b-489d1c1a9909	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	\N	\N	2026-08-23 01:45:08.988792+05:45
082fe7b5-9184-4842-b097-85609daefb35	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	\N	\N	2026-08-23 01:45:21.167325+05:45
f84a85a7-9c3f-428e-8358-e85bff983edd	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	\N	\N	2026-08-23 01:45:34.669204+05:45
253c331e-f968-4bb5-b78d-9074e6feb053	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	\N	\N	2026-08-23 01:45:46.89103+05:45
dae71e28-4d18-427c-8c3c-ef938616c878	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	\N	\N	2026-08-23 01:45:59.466401+05:45
5346c340-928e-4b77-80fb-300b0e817d3d	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 01:47:25.503009+05:45
7d0ce3a4-0a79-455e-851a-9ee886796ef2	28c47552-538e-4a07-bbc0-4a04111d65c9	LOGIN	users	28c47552-538e-4a07-bbc0-4a04111d65c9	127.0.0.1	Audit-Test-Agent/1.0	{"method": "phone_otp"}	2026-08-23 01:50:00.650645+05:45
1de159ea-0d0a-4188-b70a-b016bc6bca89	28c47552-538e-4a07-bbc0-4a04111d65c9	PHONE_VERIFIED	auth	\N	127.0.0.1	\N	\N	2026-08-23 01:50:00.666392+05:45
c7f463db-c73c-4dcf-9b01-798646007fb4	28c47552-538e-4a07-bbc0-4a04111d65c9	CONSENT_CREATED	consents	ebd13f24-1c69-4195-ae42-ca67dd2eb3d4	127.0.0.1	\N	\N	2026-08-23 01:50:00.672091+05:45
da07300e-1325-43bb-94db-3019c7800ecf	2cb12129-7a7d-4fe7-9d38-055ee518ab1c	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "high", "creditScore": 780}	2026-08-23 01:50:00.711139+05:45
7e619ad0-20fc-49c9-a739-68bb6cce9834	2cb12129-7a7d-4fe7-9d38-055ee518ab1c	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "low", "creditScore": 620}	2026-08-23 01:50:00.718105+05:45
46c22b19-58dd-4d7d-8aa5-2c98597a8fbd	d8069fea-e838-45ac-b9bc-59d9881e21ac	INSURANCE_GAP_ANALYSED	insurance_gap_analysis	\N	\N	\N	{"gapScore": 75, "severity": "low"}	2026-08-23 01:50:00.781766+05:45
9314653c-1999-419d-ad3c-31df4a62011b	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 01:50:14.13357+05:45
d48357c9-9bcf-4f38-ab6a-3ec0df64e3a6	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 01:50:20.265317+05:45
a12fd826-c8fb-4e2f-8fd0-89f12ee70527	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 01:51:54.577944+05:45
9b5a9bd5-5dde-4dcb-8086-1c2aa2b9f868	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 01:51:58.383394+05:45
20ea1f01-e89b-43ef-97d1-7fe4cd7f812b	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 01:52:19.048887+05:45
ff28f043-010e-4baf-b97c-2ff2127e0195	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 01:52:27.415047+05:45
c15002c9-89ff-4ee6-a8f0-3b6a8c90d65d	6c5d2441-753c-4529-bb3d-d612443a873f	LOGIN	users	6c5d2441-753c-4529-bb3d-d612443a873f	127.0.0.1	Audit-Test-Agent/1.0	{"method": "phone_otp"}	2026-08-23 01:55:18.404856+05:45
4ccee8b0-975c-443b-a6c6-7f95d633f2d8	6c5d2441-753c-4529-bb3d-d612443a873f	PHONE_VERIFIED	auth	\N	127.0.0.1	\N	\N	2026-08-23 01:55:18.422646+05:45
f729cfa3-da96-4ccd-a991-e4e7ae136802	6c5d2441-753c-4529-bb3d-d612443a873f	CONSENT_CREATED	consents	29794a63-df59-4419-bda5-0847916baa5b	127.0.0.1	\N	\N	2026-08-23 01:55:18.427726+05:45
c17a47a1-eab8-4853-9402-d0b5bc4c5eb5	414e5c6a-cdeb-4f4b-950f-c9b7a634c630	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "high", "creditScore": 780}	2026-08-23 01:55:18.459756+05:45
f98d111d-82cc-42d2-8c18-b6948af6efb3	414e5c6a-cdeb-4f4b-950f-c9b7a634c630	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "low", "creditScore": 620}	2026-08-23 01:55:18.466316+05:45
5c559d1b-3bc9-41ce-b63d-47e10be255bf	4fff5216-69eb-48b5-aaa3-533ce281f73a	INSURANCE_GAP_ANALYSED	insurance_gap_analysis	\N	\N	\N	{"gapScore": 75, "severity": "low"}	2026-08-23 01:55:18.530194+05:45
ee24b5da-2dd5-4663-861a-0d0a31413588	10cf643c-d7ed-4870-a381-7297eb3e148b	LOGIN	users	10cf643c-d7ed-4870-a381-7297eb3e148b	127.0.0.1	Audit-Test-Agent/1.0	{"method": "phone_otp"}	2026-08-23 01:58:08.262175+05:45
3afbb26c-de63-4ee1-8eb1-3da8458b9161	10cf643c-d7ed-4870-a381-7297eb3e148b	PHONE_VERIFIED	auth	\N	127.0.0.1	\N	\N	2026-08-23 01:58:08.28035+05:45
859fd7a4-2e3b-43c3-adce-aec28cc1c1bf	10cf643c-d7ed-4870-a381-7297eb3e148b	CONSENT_CREATED	consents	65ba744e-7740-4ab2-af08-005c590dbfed	127.0.0.1	\N	\N	2026-08-23 01:58:08.284765+05:45
778b5b72-13a6-462f-aa16-244e0656d6e8	9b65cda3-ad8e-48d7-b835-28e661ba561c	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "high", "creditScore": 780}	2026-08-23 01:58:08.315257+05:45
33914702-cdb5-4f44-b2db-c9548911bcd4	9b65cda3-ad8e-48d7-b835-28e661ba561c	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "low", "creditScore": 620}	2026-08-23 01:58:08.321549+05:45
7a1aba14-5a92-4256-975f-d48356877b41	688b9e07-3239-42f6-b88b-48e76be60566	INSURANCE_GAP_ANALYSED	insurance_gap_analysis	\N	\N	\N	{"gapScore": 75, "severity": "low"}	2026-08-23 01:58:08.390216+05:45
aafd3ecd-35c9-4e01-ba9b-28ce62b8c952	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 01:59:01.959199+05:45
28464ade-a8e6-4bd6-99a7-d68315574bc0	11e156f0-797c-41c2-8322-5603e60a5fd8	LOGOUT	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 02:00:21.413984+05:45
ca18e1b4-7293-4bf3-99c1-fc29499e51fd	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 02:00:31.90536+05:45
7fe7f28a-0dc1-41d8-95cd-deebec65d0f3	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 02:00:56.99958+05:45
fea0e439-23a4-43b1-98c3-af67cd2dd0c9	11e156f0-797c-41c2-8322-5603e60a5fd8	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "high", "creditScore": 760}	2026-08-23 02:01:16.583998+05:45
e31a66cc-6930-4624-a2b7-ed79543cfaf8	a7344d9e-cf7e-4b12-b564-4c28a27b899a	LOGIN	users	a7344d9e-cf7e-4b12-b564-4c28a27b899a	127.0.0.1	Audit-Test-Agent/1.0	{"method": "phone_otp"}	2026-08-23 14:24:15.401573+05:45
b2ed3035-fc48-4ef3-a349-f3e0c8ad185e	a7344d9e-cf7e-4b12-b564-4c28a27b899a	PHONE_VERIFIED	auth	\N	127.0.0.1	\N	\N	2026-08-23 14:24:15.420667+05:45
1d63eaa5-f31d-4237-ab2c-d1e46cdbc217	a7344d9e-cf7e-4b12-b564-4c28a27b899a	CONSENT_CREATED	consents	a08b2a29-2740-407f-97b0-f8dc1834ca28	127.0.0.1	\N	\N	2026-08-23 14:24:15.423234+05:45
88d920a9-6d5e-4a54-8cba-289af0542a43	4e30793a-ab3a-4dae-af0a-312ae3817ea5	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "high", "creditScore": 780}	2026-08-23 14:24:15.443633+05:45
953038f3-d103-406e-939b-b04ccbc5d50e	4e30793a-ab3a-4dae-af0a-312ae3817ea5	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "low", "creditScore": 620}	2026-08-23 14:24:15.447408+05:45
d9f24955-f318-43ce-97bd-ef2a5385c383	87ea7581-68cc-463a-9208-972a07801f2b	INSURANCE_GAP_ANALYSED	insurance_gap_analysis	\N	\N	\N	{"gapScore": 75, "severity": "low"}	2026-08-23 14:24:15.502038+05:45
afb52dd1-125b-4857-a4b1-ab54adf0dfb3	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 14:24:44.136395+05:45
07b5e0a3-8123-425c-9ef0-85f107885d36	11e156f0-797c-41c2-8322-5603e60a5fd8	LOGOUT	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 14:24:45.832983+05:45
d4ac26c7-d9e9-4044-a994-94f5e7fd6b61	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 14:40:50.156009+05:45
a70b1628-0744-4e91-b199-ae5f40821c8d	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 14:41:43.288856+05:45
015089be-ea19-43ea-8bdf-5b6812f462c3	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 14:42:07.720287+05:45
9d5c76fe-eae6-4322-972b-cce793d3b175	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 14:42:42.699912+05:45
cbe70216-b90d-4cdc-a9e1-dfb1ec86d706	f36a4214-96bd-4e9c-9283-c45b813fa503	LOGIN	users	f36a4214-96bd-4e9c-9283-c45b813fa503	127.0.0.1	Audit-Test-Agent/1.0	{"method": "phone_otp"}	2026-08-23 14:44:14.036783+05:45
4d00cc53-5fe7-4d2c-902b-850a2f2b3814	f36a4214-96bd-4e9c-9283-c45b813fa503	PHONE_VERIFIED	auth	\N	127.0.0.1	\N	\N	2026-08-23 14:44:14.044523+05:45
0e8e09f9-02d9-4f56-b77f-682a753e4782	f36a4214-96bd-4e9c-9283-c45b813fa503	CONSENT_CREATED	consents	29d28421-0f86-402e-94a8-a93065aec9f9	127.0.0.1	\N	\N	2026-08-23 14:44:14.047012+05:45
8ee897af-59c2-4782-8401-6435305bf8ff	607cfa4e-7e8b-409f-90de-aa14a78d913f	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "high", "creditScore": 780}	2026-08-23 14:44:14.071408+05:45
ecdf6a94-e3fc-4f8b-965a-7d85f26e48ac	607cfa4e-7e8b-409f-90de-aa14a78d913f	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "low", "creditScore": 620}	2026-08-23 14:44:14.075449+05:45
2b7bd040-8365-40b3-8413-61156714cca4	7cd9e9db-ba97-4b4f-a2d2-6d5acf4a7964	INSURANCE_GAP_ANALYSED	insurance_gap_analysis	\N	\N	\N	{"gapScore": 75, "severity": "low"}	2026-08-23 14:44:14.109907+05:45
fecfdf50-f71c-4c1e-9d87-5fdc9b6d5cea	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 14:54:43.299585+05:45
30531cb9-3c4b-46ce-a67e-badea9efb8ea	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 14:56:58.346238+05:45
d154cd0a-d70f-45d1-84f0-8984ddee1cb3	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 14:57:02.353704+05:45
f8170a43-afd1-4f4f-8b94-de03d959ab4e	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 15:01:52.432895+05:45
205002cc-0cad-4796-b99e-3d566a9b057b	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 15:03:13.066074+05:45
c123740e-f845-40c2-9aa1-198a14a29120	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 15:03:17.368677+05:45
ac6a3d9e-6561-4a85-b376-42d9784df434	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 15:03:30.431352+05:45
56c3d06c-f5c4-4ab2-98d6-99302557f172	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 15:04:10.599498+05:45
cdcccb55-6e48-4d7c-9565-d818c493142e	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 15:04:45.311836+05:45
fb225af0-94f5-496d-8f6a-7e00a09d50ab	11e156f0-797c-41c2-8322-5603e60a5fd8	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "high", "creditScore": 760}	2026-08-23 15:05:37.880829+05:45
bed0bbf7-8513-487c-9718-9aa7684a1811	11e156f0-797c-41c2-8322-5603e60a5fd8	INSURANCE_GAP_ANALYSED	insurance_gap_analysis	\N	\N	\N	{"gapScore": 0, "severity": "critical"}	2026-08-23 15:05:46.903993+05:45
dc353e0e-f4b5-4a89-9c01-c9126847da44	11e156f0-797c-41c2-8322-5603e60a5fd8	INSURANCE_GAP_ANALYSED	insurance_gap_analysis	\N	\N	\N	{"gapScore": 0, "severity": "critical"}	2026-08-23 15:06:42.260543+05:45
ae262581-9c90-461c-a6ba-fb5a9ac91a55	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 15:15:32.632788+05:45
8669c7dd-098b-45c8-a0bb-37943b796a4c	11e156f0-797c-41c2-8322-5603e60a5fd8	INSURANCE_GAP_ANALYSED	insurance_gap_analysis	\N	\N	\N	{"gapScore": 0, "severity": "critical"}	2026-08-23 15:15:33.228012+05:45
8c6648d1-6130-4738-8476-de04dab316e8	11e156f0-797c-41c2-8322-5603e60a5fd8	INSURANCE_GAP_ANALYSED	insurance_gap_analysis	\N	\N	\N	{"gapScore": 0, "severity": "critical"}	2026-08-23 15:16:10.873106+05:45
1b371f88-a22f-4bd8-b9ca-0dabe1678fe6	11e156f0-797c-41c2-8322-5603e60a5fd8	INSURANCE_GAP_ANALYSED	insurance_gap_analysis	\N	\N	\N	{"gapScore": 0, "severity": "critical"}	2026-08-23 15:18:08.860987+05:45
26d42693-8c69-4cf2-80ee-59b595427a09	11e156f0-797c-41c2-8322-5603e60a5fd8	INSURANCE_GAP_ANALYSED	insurance_gap_analysis	\N	\N	\N	{"gapScore": 0, "severity": "critical"}	2026-08-23 15:19:38.821661+05:45
34a5315a-bdeb-4f30-81d2-a819cf31f7de	11e156f0-797c-41c2-8322-5603e60a5fd8	LAND_SEARCH	ancestral_search	b78136fb-992a-4f15-98a5-03459e2a69db	\N	\N	{"state": "telangana", "ancestorName": "Nitesh"}	2026-08-23 15:21:57.514355+05:45
85359f60-201a-4b4f-a157-743dfa3dfbc7	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 15:30:26.536173+05:45
7b887f0e-91de-432f-a25f-0a4af395b869	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 15:31:04.093225+05:45
57b15b14-4b2a-4d8b-8a10-4ead6ca7e774	11e156f0-797c-41c2-8322-5603e60a5fd8	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "high", "creditScore": 760}	2026-08-23 15:31:04.651279+05:45
be98f096-152c-4be8-a081-4084af7778ad	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 15:31:49.069034+05:45
2332991e-173f-4b61-8da2-d7a75a9a47f8	11e156f0-797c-41c2-8322-5603e60a5fd8	INSURANCE_GAP_ANALYSED	insurance_gap_analysis	\N	\N	\N	{"gapScore": 0, "severity": "critical"}	2026-08-23 15:32:03.82603+05:45
5b10e7ff-81d9-40d9-9e3e-cd45bed9104d	11e156f0-797c-41c2-8322-5603e60a5fd8	INSURANCE_GAP_ANALYSED	insurance_gap_analysis	\N	\N	\N	{"gapScore": 0, "severity": "critical"}	2026-08-23 15:32:11.570694+05:45
23725d6e-16f5-451d-a02b-32c8332cf17b	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 15:36:41.650272+05:45
0808bebb-b2fe-430a-bbdf-2577c1d3af34	11e156f0-797c-41c2-8322-5603e60a5fd8	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "high", "creditScore": 760}	2026-08-23 15:37:39.732072+05:45
280102d2-01cf-4e9e-a5f3-8ca650268b44	11e156f0-797c-41c2-8322-5603e60a5fd8	INSURANCE_GAP_ANALYSED	insurance_gap_analysis	\N	\N	\N	{"gapScore": 1, "severity": "critical"}	2026-08-23 15:38:14.979354+05:45
45315b81-b84b-42c5-98fb-2ab2dabd6af4	11e156f0-797c-41c2-8322-5603e60a5fd8	LOGOUT	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 15:40:39.654564+05:45
7b719bef-b853-469e-a984-aca9bf38bb1b	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 15:40:44.25569+05:45
e3eaed0d-cd71-42b8-8d64-fe59263ba2e8	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 15:40:58.4005+05:45
dd60835e-3231-418f-980d-ac752bd16248	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 15:49:27.858432+05:45
3ff9f5dd-11f0-4b45-b3ab-4d2d4cf958a6	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 15:57:14.624949+05:45
61cc60a6-7c08-48e1-8d43-89f17ef5d460	11e156f0-797c-41c2-8322-5603e60a5fd8	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 16:16:56.221707+05:45
14dede0d-242e-49cb-b57d-55f2b7826721	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 16:17:22.809582+05:45
88d52cf3-70e6-40f7-bd9f-69d6eb923695	11e156f0-797c-41c2-8322-5603e60a5fd8	LOGOUT	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 16:20:10.336386+05:45
ab31b8c5-b984-4b99-a0bc-28e853777872	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 16:37:41.373143+05:45
ce17d774-a656-4a60-8c57-27951d13d02a	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 16:38:01.717004+05:45
63adb1b2-d495-4974-905a-0f8ea6aceabf	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 16:39:17.240871+05:45
b76d45d5-531f-4b41-a2f0-78f1cb739efe	a1ca480d-9ff7-4d8c-b33c-8c906c0d5b55	AADHAAR_VERIFIED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 16:45:22.524734+05:45
3d3bb352-16e0-4d9b-913d-a8b083c9d3f8	a1ca480d-9ff7-4d8c-b33c-8c906c0d5b55	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 17:30:05.306116+05:45
0d6bb1fb-0bef-41b5-b097-50742174bde8	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 17:30:19.071071+05:45
518f8120-56ee-494f-9347-1879a87d42ac	a1ca480d-9ff7-4d8c-b33c-8c906c0d5b55	PHONE_VERIFIED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 17:30:34.371283+05:45
45b048e9-75c7-4bb6-a039-17aabfa1bfe0	a1ca480d-9ff7-4d8c-b33c-8c906c0d5b55	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 17:31:37.635102+05:45
959bc2bd-fbb2-4b83-9a5d-bb177a8c638b	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 17:33:51.39074+05:45
3cb0cb70-f9b1-48eb-9ea9-ff1ff1cce2ff	a1ca480d-9ff7-4d8c-b33c-8c906c0d5b55	PHONE_VERIFIED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 17:34:31.973179+05:45
523352e8-9cda-4e85-bd61-dadb48d6a867	a1ca480d-9ff7-4d8c-b33c-8c906c0d5b55	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 17:34:35.400751+05:45
37f9fb08-e9fc-44ad-9efb-1bed46d7ce9b	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 18:48:29.908167+05:45
33f17145-9e90-4331-b3aa-b5bbe6c78513	a1ca480d-9ff7-4d8c-b33c-8c906c0d5b55	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 18:51:11.2055+05:45
e9b5bac5-fef7-49ad-a491-5970b5b9f1d6	a1ca480d-9ff7-4d8c-b33c-8c906c0d5b55	LOGOUT	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 18:51:12.853888+05:45
8a435051-5776-4ee1-9e8c-eb3e043dd45e	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 19:02:33.476015+05:45
73eab265-4bad-4e93-b74c-e54d0432cfed	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 19:07:42.131113+05:45
a9baea95-4715-4d1a-99d6-9595c35a6ccf	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 19:16:48.150935+05:45
975a2f1e-e8b3-4e48-9eda-543893b90b59	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 19:27:27.37901+05:45
995b92a8-e8c7-455c-a8a7-f81d19d01d64	11e156f0-797c-41c2-8322-5603e60a5fd8	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "high", "creditScore": 760}	2026-08-23 19:30:25.585769+05:45
ea9b306f-f803-45be-b062-0b0177a07c02	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 19:31:20.881422+05:45
c2f9f667-d5d6-458e-a725-e9094a3c86cc	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 19:31:54.632524+05:45
a9aa27f5-91e2-45a6-bbc0-92dc9b9d41bd	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 19:32:25.28757+05:45
8121e244-ff8f-4ba5-9e48-a6476752c296	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 19:32:27.4827+05:45
1fefe6fc-9b4c-4ae3-ada5-e98788abbc80	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 19:33:25.726681+05:45
b598f7cf-6112-409c-aa3b-54d0446ac5eb	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 19:34:32.236165+05:45
072a3d91-7eb3-4df4-992e-cfef01bd9838	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 19:34:40.58259+05:45
7d9bbcda-2041-4161-9d32-56e9fddf8d6e	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 19:34:44.671321+05:45
09d12235-12d9-45b4-8898-0aab3a6321b0	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 19:34:48.275875+05:45
5b83f9d4-3ee6-4aff-b48b-e533fc0d6b6c	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 19:35:52.238067+05:45
ff4f502d-023d-4e26-bc9b-36fee4656a58	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 19:36:22.960302+05:45
6eacd5dd-4507-411d-ae64-5ae9061a93a1	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 19:37:47.763676+05:45
204e29e8-f0db-4858-8e51-a463375352a9	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 19:38:47.049577+05:45
301acd27-0c8e-4d98-8d77-c23eff03753f	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 19:40:45.718511+05:45
5302adca-ed36-4c38-8bd6-f470d609c518	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 19:41:01.224097+05:45
a80e3c86-9e81-43d0-a886-ea0649dea944	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 19:42:22.080849+05:45
bb994178-1a16-443b-814c-2c147db609ae	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 19:43:00.779981+05:45
35017e82-5f61-478a-8add-297fdb9115b8	11e156f0-797c-41c2-8322-5603e60a5fd8	LOAN_ELIGIBILITY_ASSESSED	loan_assessments	\N	\N	\N	{"band": "high", "creditScore": 760}	2026-08-23 19:44:05.924045+05:45
cb7f2299-ffdc-4230-b25b-83b6bc69b4aa	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 19:44:39.347626+05:45
a398a048-04cc-410c-bd54-84a829b72631	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 19:44:47.306547+05:45
884ec585-11d2-4820-ae5c-ace1d6bcc218	11e156f0-797c-41c2-8322-5603e60a5fd8	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 19:46:35.697073+05:45
d0b9d2dd-9e42-43dc-8fae-0c9d78dd1ec3	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 20:04:13.35656+05:45
8f5cf858-abe5-4cbc-aeba-2625e0447e0d	dddc9844-5d6f-4ce7-8765-687e8703c1ff	CONSENT_APPROVED	consents	d89155f8-4ad4-4555-8a28-f997a4d06131	\N	\N	\N	2026-08-23 20:10:42.115786+05:45
47130b7a-6139-423e-9770-b1048a94eac4	dddc9844-5d6f-4ce7-8765-687e8703c1ff	DATA_FETCHED	asset_snapshots	d89155f8-4ad4-4555-8a28-f997a4d06131	\N	\N	\N	2026-08-23 20:10:42.152731+05:45
53c60adc-d733-4e1f-b0cf-981c567c114b	dddc9844-5d6f-4ce7-8765-687e8703c1ff	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 20:10:45.366099+05:45
3cccaea4-1bd8-48be-a067-166a1ed623e4	dddc9844-5d6f-4ce7-8765-687e8703c1ff	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 20:10:55.950845+05:45
e3aa41e8-7cb6-4acc-aa0e-2e1a073754a0	dddc9844-5d6f-4ce7-8765-687e8703c1ff	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 20:11:20.5191+05:45
56931642-afa5-42c8-9a99-936d25e95a4c	dddc9844-5d6f-4ce7-8765-687e8703c1ff	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 20:14:46.735903+05:45
745844b2-0aa3-48ee-b878-4939cd5e3340	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 20:15:55.959808+05:45
f518f9da-130d-4737-bae9-bbab166d1a4a	dddc9844-5d6f-4ce7-8765-687e8703c1ff	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 20:16:37.040752+05:45
d4b972e2-6f18-4154-9e99-0b615b09a6cb	dddc9844-5d6f-4ce7-8765-687e8703c1ff	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 20:18:39.914671+05:45
6b0a62fc-bf0f-43cc-bef8-9d0005f874d3	3e6a8df6-add6-4d20-8392-f452b8ceddc3	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 20:19:49.172642+05:45
9d226101-742e-476c-a4bb-6f191fec7042	3e6a8df6-add6-4d20-8392-f452b8ceddc3	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 20:20:25.851997+05:45
a8897877-9468-4f99-8165-19b645e620c8	3e6a8df6-add6-4d20-8392-f452b8ceddc3	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 20:20:44.93257+05:45
6aca83f9-79c4-41d8-afb2-3f9738712b7b	3e6a8df6-add6-4d20-8392-f452b8ceddc3	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 20:23:01.753381+05:45
881aabec-b1a4-402f-ae81-c9ed8282f4eb	3e6a8df6-add6-4d20-8392-f452b8ceddc3	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 20:23:14.148908+05:45
7b418cb4-d7e2-4cdc-b40a-765e44acd637	3e6a8df6-add6-4d20-8392-f452b8ceddc3	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 20:25:27.124772+05:45
1c587fcd-0d6c-46d4-8f5d-18850d12c47f	3e6a8df6-add6-4d20-8392-f452b8ceddc3	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 22:32:21.258711+05:45
56ab5efc-46bb-41da-bfd1-467a44d0ba0d	3e6a8df6-add6-4d20-8392-f452b8ceddc3	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 22:32:23.726314+05:45
6663fd72-bcf7-457e-973a-90dc99a8b459	3e6a8df6-add6-4d20-8392-f452b8ceddc3	TOKEN_REFRESHED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 22:55:00.390126+05:45
16fc2045-f4cc-41ee-be6a-d7c81c921c03	3e6a8df6-add6-4d20-8392-f452b8ceddc3	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 22:55:02.743424+05:45
4ebde966-467f-4b12-a621-e3c679625818	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 22:55:57.471776+05:45
c995d329-4024-46c2-804c-b6f439a58a11	3e6a8df6-add6-4d20-8392-f452b8ceddc3	LOGOUT	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 22:58:18.344281+05:45
f07682c8-1c53-4773-b731-7f58733dfe5e	\N	PHONE_OTP_INITIATED	auth	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 22:59:53.613587+05:45
03b47ba9-3246-4532-93b1-ac5cd361da07	3e6a8df6-add6-4d20-8392-f452b8ceddc3	AUDIT_LOG_VIEWED	audit_logs	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	2026-08-23 23:03:20.045419+05:45
\.


ALTER TABLE public.audit_logs ENABLE TRIGGER ALL;

--
-- Data for Name: b2b_clients; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.b2b_clients DISABLE TRIGGER ALL;

COPY public.b2b_clients (id, business_name, business_type, contact_email, tier, rate_limit_per_hour, rate_limit_per_day, allowed_endpoints, is_active, is_verified, created_at, updated_at) FROM stdin;
adb2b287-12d0-4f5c-bda8-b1416f3bdf49	AssetMap Law Demo	law_firm	demo@assetmap.in	basic	1000	10000	[]	t	f	2026-07-15 21:28:38.760633+05:45	2026-07-15 21:28:38.760633+05:45
ca0db8e3-5ad6-4696-b9e7-76ffec46b671	Wealth Manager Pro	wealth_manager	wealth@assetmap.in	basic	1000	10000	[]	t	f	2026-07-15 21:28:38.760633+05:45	2026-07-15 21:28:38.760633+05:45
fd1aae6e-573e-4d0e-bd3b-5e247873bcbb	Rapid NBFC	nbfc	nbfc@assetmap.in	basic	1000	10000	[]	t	f	2026-07-15 21:28:38.760633+05:45	2026-07-15 21:28:38.760633+05:45
0a971708-8a96-4286-afa6-7558532a9a27	Safe Guard Insurance	insurance_company	insure@assetmap.in	basic	1000	10000	[]	t	f	2026-07-15 21:28:38.760633+05:45	2026-07-15 21:28:38.760633+05:45
679e0df8-36d8-4196-9a25-00c181e8c9d4	HR Connect Payroll	hr_payroll	hr@assetmap.in	basic	1000	10000	[]	t	f	2026-07-15 21:28:38.760633+05:45	2026-07-15 21:28:38.760633+05:45
\.


ALTER TABLE public.b2b_clients ENABLE TRIGGER ALL;

--
-- Data for Name: b2b_api_keys; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.b2b_api_keys DISABLE TRIGGER ALL;

COPY public.b2b_api_keys (id, client_id, key_hash, key_prefix, environment, description, scopes, ip_whitelist, is_active, revoked_at, expires_at, last_used_at, created_at) FROM stdin;
74506b91-4087-42d8-8592-333b03f8ea35	adb2b287-12d0-4f5c-bda8-b1416f3bdf49	c946760c41ad20720847ec5879bbf939a992edfcfe2b7f531dadeeadb7b1af13	am_sandbox_f33ec82f	sandbox	\N	{}	{}	t	\N	\N	2026-07-15 21:28:43.8483+05:45	2026-07-15 21:28:38.850081+05:45
68df88c4-40c1-4999-8cac-c048ca922a44	ca0db8e3-5ad6-4696-b9e7-76ffec46b671	2bfc22ddb2fe71adbf12a0ad720a62434f6e774d96ad6bd50b2aa2af4e5ac601	am_sandbox_20433bee	sandbox	\N	{}	{}	t	\N	\N	2026-07-15 21:28:44.282433+05:45	2026-07-15 21:28:43.874015+05:45
8b9c2f1d-9d93-4328-a969-88ed59deba11	fd1aae6e-573e-4d0e-bd3b-5e247873bcbb	f8857101e2fe984a28057a4bd1922bc639be9872483de782879bd9cc7b1840de	am_sandbox_aabd2ccb	sandbox	\N	{}	{}	t	\N	\N	2026-07-15 21:28:44.773249+05:45	2026-07-15 21:28:44.291692+05:45
85cd7dd0-7eaa-4cdb-94c0-dffdc8cfae64	0a971708-8a96-4286-afa6-7558532a9a27	84c1bf5a73465f8ee07fe9eeb3374ec220eb2618c0b51cadf88f0fb03d6db716	am_sandbox_e1e779ab	sandbox	\N	{}	{}	t	\N	\N	2026-07-15 21:28:45.587118+05:45	2026-07-15 21:28:44.783302+05:45
8b26f4b4-d5a7-4734-abce-61ac2f11b526	679e0df8-36d8-4196-9a25-00c181e8c9d4	b6961cb183cac5a03f994a89e10dc772516238a89868914114187ec5cbad8bb8	am_sandbox_9255a48c	sandbox	\N	{}	{}	t	\N	\N	2026-07-15 21:28:46.144574+05:45	2026-07-15 21:28:45.609256+05:45
\.


ALTER TABLE public.b2b_api_keys ENABLE TRIGGER ALL;

--
-- Data for Name: b2b_user_consents; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.b2b_user_consents DISABLE TRIGGER ALL;

COPY public.b2b_user_consents (id, user_id, client_id, status, granted_at, expires_at, ip_address, user_agent) FROM stdin;
\.


ALTER TABLE public.b2b_user_consents ENABLE TRIGGER ALL;

--
-- Data for Name: b2b_webhook_endpoints; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.b2b_webhook_endpoints DISABLE TRIGGER ALL;

COPY public.b2b_webhook_endpoints (id, client_id, url, secret_key_enc, events, is_active, created_at) FROM stdin;
\.


ALTER TABLE public.b2b_webhook_endpoints ENABLE TRIGGER ALL;

--
-- Data for Name: b2b_webhook_deliveries; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.b2b_webhook_deliveries DISABLE TRIGGER ALL;

COPY public.b2b_webhook_deliveries (id, endpoint_id, event_type, payload, status, attempts, next_attempt_at, last_error, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.b2b_webhook_deliveries ENABLE TRIGGER ALL;

--
-- Data for Name: backup_codes; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.backup_codes DISABLE TRIGGER ALL;

COPY public.backup_codes (id, user_id, code_hash, is_used, used_at, created_at) FROM stdin;
\.


ALTER TABLE public.backup_codes ENABLE TRIGGER ALL;

--
-- Data for Name: category_budgets; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.category_budgets DISABLE TRIGGER ALL;

COPY public.category_budgets (id, user_id, category, budget_paise, period, is_active, created_at) FROM stdin;
\.


ALTER TABLE public.category_budgets ENABLE TRIGGER ALL;

--
-- Data for Name: classified_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.classified_transactions DISABLE TRIGGER ALL;

COPY public.classified_transactions (id, user_id, source_account_id, bank_name, account_ref_hash, transaction_date, value_date, narration, amount_paise, transaction_type, reference_number, mode, merchant_name, merchant_category_code, category, subcategory, category_group, confidence, classified_by, classification_reason, user_category, user_corrected_at, user_notes, dedup_hash, is_emi, is_recurring, recurring_interval_days, is_suspicious, is_ignored, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.classified_transactions ENABLE TRIGGER ALL;

--
-- Data for Name: dormant_accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.dormant_accounts DISABLE TRIGGER ALL;

COPY public.dormant_accounts (id, user_id, account_ref, institution_name, fi_type, balance_paise, last_transaction_date, months_inactive, is_acknowledged, acknowledged_at, iepf_risk, iepf_transfer_date, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.dormant_accounts ENABLE TRIGGER ALL;

--
-- Data for Name: estate_cases; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.estate_cases DISABLE TRIGGER ALL;

COPY public.estate_cases (id, filed_by_user_id, deceased_name_encrypted, deceased_aadhaar_hash, death_certificate_s3_key, legal_heir_doc_s3_key, status, verified_at, created_at) FROM stdin;
\.


ALTER TABLE public.estate_cases ENABLE TRIGGER ALL;

--
-- Data for Name: family_vaults; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.family_vaults DISABLE TRIGGER ALL;

COPY public.family_vaults (id, primary_user_id, vault_name, max_members, is_active, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.family_vaults ENABLE TRIGGER ALL;

--
-- Data for Name: family_activity_feed; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.family_activity_feed DISABLE TRIGGER ALL;

COPY public.family_activity_feed (id, vault_id, user_id, activity_type, title, body, metadata, is_visible_to_all, created_at) FROM stdin;
\.


ALTER TABLE public.family_activity_feed ENABLE TRIGGER ALL;

--
-- Data for Name: family_goals; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.family_goals DISABLE TRIGGER ALL;

COPY public.family_goals (id, vault_id, created_by_user_id, name, description, goal_type, emoji, target_amount_paise, current_amount_paise, target_date, contributing_members, status, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.family_goals ENABLE TRIGGER ALL;

--
-- Data for Name: family_goal_contributions; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.family_goal_contributions DISABLE TRIGGER ALL;

COPY public.family_goal_contributions (id, goal_id, user_id, amount_paise, note, contributed_at) FROM stdin;
\.


ALTER TABLE public.family_goal_contributions ENABLE TRIGGER ALL;

--
-- Data for Name: family_networth_snapshots; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.family_networth_snapshots DISABLE TRIGGER ALL;

COPY public.family_networth_snapshots (id, vault_id, snapshot_month, total_paise, member_breakdown, asset_breakdown, member_count, created_at) FROM stdin;
\.


ALTER TABLE public.family_networth_snapshots ENABLE TRIGGER ALL;

--
-- Data for Name: family_vault_members; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.family_vault_members DISABLE TRIGGER ALL;

COPY public.family_vault_members (id, vault_id, user_id, primary_user_id, invite_token, invite_token_expires, invited_mobile, invited_name, relationship, status, share_bank_accounts, share_fixed_deposits, share_mutual_funds, share_equity, share_nps, share_epf, share_insurance, share_land, share_gold, share_total_networth, display_name, avatar_color, invited_at, accepted_at, last_synced_at, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.family_vault_members ENABLE TRIGGER ALL;

--
-- Data for Name: feature_usage; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.feature_usage DISABLE TRIGGER ALL;

COPY public.feature_usage (id, user_id, feature_key, period, usage_count, last_used_at) FROM stdin;
\.


ALTER TABLE public.feature_usage ENABLE TRIGGER ALL;

--
-- Data for Name: financial_accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.financial_accounts DISABLE TRIGGER ALL;

COPY public.financial_accounts (id, user_id, consent_id, fi_type, institution_name, account_ref_encrypted, account_type, holder_name_encrypted, ifsc_code, branch, nominee_encrypted, balance_encrypted, currency, status, opened_at, maturity_date, raw_json_encrypted, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.financial_accounts ENABLE TRIGGER ALL;

--
-- Data for Name: health_check_results; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.health_check_results DISABLE TRIGGER ALL;

COPY public.health_check_results (id, check_name, status, detail, created_at) FROM stdin;
2145868b-33ec-4b6d-bdd0-43e1daa39c7c	database	pass	{"timestamp": "2026-08-16T19:29:11.124Z", "response_ms": 18}	2026-08-17 01:14:11.124258+05:45
8aa51cd7-678b-42ca-a057-d378e529a8fd	redis	pass	{"timestamp": "2026-08-16T19:29:11.133Z", "response_ms": 269}	2026-08-17 01:14:11.124258+05:45
dbd0249f-112a-458a-a2b8-f0963f6efbb9	setu_api	pass	{"timestamp": "2026-08-16T19:29:11.134Z", "response_ms": 905}	2026-08-17 01:14:11.124258+05:45
7b0011e8-55c5-4029-affe-67b70cb7a764	anthropic_api	warn	{"timestamp": "2026-08-16T19:29:11.134Z", "error_code": 401, "response_ms": 411}	2026-08-17 01:14:11.124258+05:45
f1f05087-8bfe-44a4-928c-a0644a77fd7c	database	pass	{"timestamp": "2026-08-16T19:32:49.067Z", "response_ms": 4}	2026-08-17 01:17:49.068413+05:45
c0d9ecc1-806e-46ed-807e-6ed1e0aa8522	redis	pass	{"timestamp": "2026-08-16T19:32:49.068Z", "response_ms": 269}	2026-08-17 01:17:49.068413+05:45
f865fba2-1259-47b1-8342-2013c30d4629	setu_api	pass	{"timestamp": "2026-08-16T19:32:49.068Z", "response_ms": 412}	2026-08-17 01:17:49.068413+05:45
5144b0fa-1da5-4915-82c5-0ae4c8db14dc	anthropic_api	warn	{"timestamp": "2026-08-16T19:32:49.068Z", "error_code": 401, "response_ms": 391}	2026-08-17 01:17:49.068413+05:45
9c822ba8-614a-4724-8e6d-25e25df33f16	database	pass	{"timestamp": "2026-08-16T19:33:14.674Z", "response_ms": 2}	2026-08-17 01:18:14.675484+05:45
b887c198-fb8c-4fcb-906d-9e26fc35171d	redis	pass	{"timestamp": "2026-08-16T19:33:14.675Z", "response_ms": 268}	2026-08-17 01:18:14.675484+05:45
0d798298-413d-4f51-a202-ec305a4d1f74	setu_api	pass	{"timestamp": "2026-08-16T19:33:14.675Z", "response_ms": 176}	2026-08-17 01:18:14.675484+05:45
ea01153b-7d58-44cf-bf4f-a8fe520c6e4b	anthropic_api	warn	{"timestamp": "2026-08-16T19:33:14.675Z", "error_code": 401, "response_ms": 381}	2026-08-17 01:18:14.675484+05:45
b572cf0c-bf3a-4351-b497-006df99ce661	database	pass	{"timestamp": "2026-08-16T19:34:39.781Z", "response_ms": 4}	2026-08-17 01:19:39.781307+05:45
5b05ec5b-625a-42d4-9e0b-a51ad11da8e3	redis	pass	{"timestamp": "2026-08-16T19:34:39.781Z", "response_ms": 268}	2026-08-17 01:19:39.781307+05:45
a91d4a14-b46e-4426-ad24-fe7098bca15b	setu_api	pass	{"timestamp": "2026-08-16T19:34:39.782Z", "response_ms": 484}	2026-08-17 01:19:39.781307+05:45
700239c1-92f3-4a12-bf30-25a4e3113d76	anthropic_api	warn	{"timestamp": "2026-08-16T19:34:39.782Z", "error_code": 401, "response_ms": 376}	2026-08-17 01:19:39.781307+05:45
68b87bbf-d33d-4d8b-b650-6acecafd38c2	database	pass	{"timestamp": "2026-08-17T15:57:33.152Z", "response_ms": 48}	2026-08-17 21:42:33.15248+05:45
37758ae8-d57b-40c8-b9db-10973bbe1160	redis	pass	{"timestamp": "2026-08-17T15:57:33.155Z", "response_ms": 283}	2026-08-17 21:42:33.15248+05:45
ef567ad6-cec2-4a32-ae58-e0673cb14ecb	setu_api	pass	{"timestamp": "2026-08-17T15:57:33.156Z", "response_ms": 1154}	2026-08-17 21:42:33.15248+05:45
646eb816-ed67-4b77-9fd3-0d384b6e3909	anthropic_api	warn	{"timestamp": "2026-08-17T15:57:33.157Z", "error_code": 401, "response_ms": 437}	2026-08-17 21:42:33.15248+05:45
24b6919b-db5b-49d4-b8e2-423214ee24d4	database	pass	{"timestamp": "2026-08-17T15:58:57.165Z", "response_ms": 10}	2026-08-17 21:43:57.166143+05:45
235d2528-9f5c-4428-8157-3a06b6f7aaaf	redis	pass	{"timestamp": "2026-08-17T15:58:57.166Z", "response_ms": 283}	2026-08-17 21:43:57.166143+05:45
d0040461-ebf7-4124-b3d7-a4f128515f71	setu_api	pass	{"timestamp": "2026-08-17T15:58:57.167Z", "response_ms": 361}	2026-08-17 21:43:57.166143+05:45
f2c8a0b7-7292-419b-9ca0-a7d216367991	anthropic_api	warn	{"timestamp": "2026-08-17T15:58:57.168Z", "error_code": 401, "response_ms": 417}	2026-08-17 21:43:57.166143+05:45
\.


ALTER TABLE public.health_check_results ENABLE TRIGGER ALL;

--
-- Data for Name: insurance_gap_analysis; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.insurance_gap_analysis DISABLE TRIGGER ALL;

COPY public.insurance_gap_analysis (id, user_id, analysed_at, annual_income_paise, age, dependents_count, outstanding_loans_paise, monthly_expenses_paise, total_life_cover_paise, total_health_cover_paise, total_term_cover_paise, has_term_plan, has_health_cover, has_critical_illness, recommended_life_paise, recommended_health_paise, recommended_term_paise, life_gap_paise, health_gap_paise, term_gap_paise, gap_severity, gap_score, affiliate_shown, affiliate_clicked, affiliate_partner, affiliate_click_at, created_at) FROM stdin;
\.


ALTER TABLE public.insurance_gap_analysis ENABLE TRIGGER ALL;

--
-- Data for Name: insurance_policies; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.insurance_policies DISABLE TRIGGER ALL;

COPY public.insurance_policies (id, user_id, policy_number_enc, insurer_name, policy_type, plan_name, sum_assured_paise, premium_paise, premium_frequency, policy_start_date, policy_end_date, maturity_date, policy_status, nominee_name_enc, nominee_relation, source, source_policy_id, raw_data_enc, is_active, fetched_at, last_synced_at, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.insurance_policies ENABLE TRIGGER ALL;

--
-- Data for Name: investment_holdings; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.investment_holdings DISABLE TRIGGER ALL;

COPY public.investment_holdings (id, account_id, user_id, symbol, scheme_name, units, nav, cost_basis, current_value, currency, holding_type, folio_number, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.investment_holdings ENABLE TRIGGER ALL;

--
-- Data for Name: land_records; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.land_records DISABLE TRIGGER ALL;

COPY public.land_records (id, user_id, survey_number_enc, plot_number_enc, khasra_number_enc, owner_name_enc, village, taluka, district, state, state_code, pin_code, area_value, area_unit, land_type, land_use, ownership_type, co_owners_count, title_status, mutation_status, encumbrance_status, dispute_details_enc, registration_date, registration_number_enc, sub_registrar_office, latitude, longitude, ulpin, estimated_value_paise, circle_rate_paise, valuation_date, valuation_source, digilocker_doc_available, digilocker_doc_uri, doc_last_fetched_at, source, source_record_id, raw_response_enc, is_verified, verified_at, verified_by, fetched_at, last_synced_at, sync_frequency_days, next_sync_at, is_stale, is_active, notes, created_at, updated_at) FROM stdin;
2d636efd-921e-4e7b-8404-29a953fe03e0	3e6a8df6-add6-4d20-8392-f452b8ceddc3	0c568f9daac62fabbc9eda395c737aae:58bee60b681535da9c3e1cacbe97795d:15430df099434813f3e0	\N	\N	547ddc193886988f1c439a100179732f:622b74c2b143856e41120510811bb4d5:2cbf8402f021	Baner	Haveli	Pune	Maharashtra	MH	\N	2.5000	acres	Agricultural	\N	inherited	0	clear	completed	\N	\N	\N	\N	\N	18.55900000	73.78680000	\N	1500000000	\N	\N	\N	f	\N	\N	dilrmp	\N	\N	f	\N	\N	2026-08-23 20:06:17.449809+05:45	2026-08-23 20:06:17.449809+05:45	30	2026-09-22 20:06:17.449809+05:45	f	t	\N	2026-08-23 20:06:17.449809+05:45	2026-08-23 20:22:52.140321+05:45
29e14461-3078-44a8-a15f-c67b3b1cf30d	dddc9844-5d6f-4ce7-8765-687e8703c1ff	0c568f9daac62fabbc9eda395c737aae:58bee60b681535da9c3e1cacbe97795d:15430df099434813f3e0	\N	\N	547ddc193886988f1c439a100179732f:622b74c2b143856e41120510811bb4d5:2cbf8402f021	Baner	Haveli	Pune	Maharashtra	MH	\N	2.5000	acres	Agricultural	\N	inherited	0	clear	completed	\N	\N	\N	\N	\N	18.55900000	73.78680000	\N	1500000000	\N	\N	\N	f	\N	\N	dilrmp	\N	\N	f	\N	\N	2026-08-23 20:12:57.447342+05:45	2026-08-23 20:12:57.447342+05:45	30	2026-09-22 20:12:57.447342+05:45	f	t	\N	2026-08-23 20:12:57.447342+05:45	2026-08-23 20:22:52.140321+05:45
f1a068a9-8b79-4a7d-8b5f-eb2309fb5105	3e6a8df6-add6-4d20-8392-f452b8ceddc3	e9705bf07625de48f0c9b27e7a128f2c:a471295c05977b041a780e5113a8e9ce:a904f05a94556b	\N	\N	547ddc193886988f1c439a100179732f:622b74c2b143856e41120510811bb4d5:2cbf8402f021	Whitefield	Bangalore East	Bangalore	Karnataka	KA	\N	2400.0000	sqft	Residential	\N	self	0	clear	completed	\N	\N	\N	\N	\N	12.96980000	77.74990000	\N	850000000	\N	\N	\N	f	\N	\N	igr	\N	\N	f	\N	\N	2026-08-23 20:06:17.449809+05:45	2026-08-23 20:06:17.449809+05:45	30	2026-09-22 20:06:17.449809+05:45	f	t	\N	2026-08-23 20:06:17.449809+05:45	2026-08-23 20:22:52.181667+05:45
f3beb000-2c0a-4b52-8bfc-548a5d032604	dddc9844-5d6f-4ce7-8765-687e8703c1ff	e9705bf07625de48f0c9b27e7a128f2c:a471295c05977b041a780e5113a8e9ce:a904f05a94556b	\N	\N	547ddc193886988f1c439a100179732f:622b74c2b143856e41120510811bb4d5:2cbf8402f021	Whitefield	Bangalore East	Bangalore	Karnataka	KA	\N	2400.0000	sqft	Residential	\N	self	0	clear	completed	\N	\N	\N	\N	\N	12.96980000	77.74990000	\N	850000000	\N	\N	\N	f	\N	\N	igr	\N	\N	f	\N	\N	2026-08-23 20:12:57.447342+05:45	2026-08-23 20:12:57.447342+05:45	30	2026-09-22 20:12:57.447342+05:45	f	t	\N	2026-08-23 20:12:57.447342+05:45	2026-08-23 20:22:52.181667+05:45
\.


ALTER TABLE public.land_records ENABLE TRIGGER ALL;

--
-- Data for Name: land_encumbrances; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.land_encumbrances DISABLE TRIGGER ALL;

COPY public.land_encumbrances (id, land_record_id, user_id, encumbrance_type, creditor_name_enc, amount_paise, start_date, end_date, is_active, raw_response_enc, created_at) FROM stdin;
\.


ALTER TABLE public.land_encumbrances ENABLE TRIGGER ALL;

--
-- Data for Name: land_mutations; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.land_mutations DISABLE TRIGGER ALL;

COPY public.land_mutations (id, land_record_id, user_id, mutation_number, mutation_type, mutation_date, from_owner_enc, to_owner_enc, area_transferred, remarks, raw_response_enc, created_at) FROM stdin;
\.


ALTER TABLE public.land_mutations ENABLE TRIGGER ALL;

--
-- Data for Name: land_sync_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.land_sync_log DISABLE TRIGGER ALL;

COPY public.land_sync_log (id, user_id, land_record_id, source, trigger, status, records_found, records_updated, records_created, error_message, api_response_time_ms, cost_paise, created_at) FROM stdin;
\.


ALTER TABLE public.land_sync_log ENABLE TRIGGER ALL;

--
-- Data for Name: loan_assessments; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.loan_assessments DISABLE TRIGGER ALL;

COPY public.loan_assessments (id, user_id, assessed_at, monthly_income_paise, monthly_obligations_paise, total_assets_paise, total_land_value_paise, existing_loans_paise, credit_score_approx, home_loan_max_paise, lap_max_paise, personal_loan_max_paise, foir, ltv_ratio, lenders_shown, lead_submitted, lead_submitted_at, lead_partner, lead_product, commission_paise, commission_paid, created_at) FROM stdin;
\.


ALTER TABLE public.loan_assessments ENABLE TRIGGER ALL;

--
-- Data for Name: loan_lenders; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.loan_lenders DISABLE TRIGGER ALL;

COPY public.loan_lenders (id, name, logo_url, lender_type, loan_types, min_loan_paise, max_loan_paise, min_rate_pct, max_rate_pct, min_tenure_months, max_tenure_months, min_income_paise, min_cibil_score, processing_fee_pct, affiliate_url, commission_paise, is_active, created_at) FROM stdin;
b1e2e91b-1a26-4a05-b039-c17523cfa6cd	HDFC Bank	\N	bank	{home_loan,lap,personal_loan}	50000000	1000000000	8.40	12.50	12	360	2500000	700	0.50	https://www.hdfcbank.com/personal/borrow/popular-loans/home-loan	\N	t	2026-08-23 01:25:55.909874+05:45
d73a4eba-96a7-4b08-a02f-6b737c0b4438	State Bank of India	\N	bank	{home_loan,lap,personal_loan}	30000000	1500000000	8.50	11.75	12	360	2000000	650	0.35	https://homeloans.sbi	\N	t	2026-08-23 01:25:55.915452+05:45
bfdd91a6-7895-4bbf-a8b6-acf31fb2188b	ICICI Bank	\N	bank	{home_loan,lap,personal_loan}	50000000	1000000000	8.65	13.00	12	360	3000000	720	0.50	https://www.icicibank.com/personal-banking/loans/home-loan	\N	t	2026-08-23 01:25:55.916778+05:45
b1f01f30-eac9-40d6-a2af-ad2c7fc8beed	Axis Bank	\N	bank	{home_loan,lap,personal_loan}	30000000	800000000	8.75	13.50	12	360	2500000	700	0.50	https://www.axisbank.com/retail/loans/home-loan	\N	t	2026-08-23 01:25:55.918078+05:45
b47e2e73-b09a-4976-b78e-74a70c0e1f94	Bajaj Finserv	\N	nbfc	{lap,personal_loan}	10000000	500000000	9.50	15.00	12	240	2000000	650	1.00	https://www.bajajfinserv.in	\N	t	2026-08-23 01:25:55.919402+05:45
\.


ALTER TABLE public.loan_lenders ENABLE TRIGGER ALL;

--
-- Data for Name: manual_assets; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.manual_assets DISABLE TRIGGER ALL;

COPY public.manual_assets (id, user_id, asset_category, asset_name, description, current_value_paise, purchase_value_paise, purchase_date, currency, foreign_currency, foreign_amount, exchange_rate_used, extra_fields, document_s3_key, document_name, valuation_method, valuation_date, next_valuation_date, valuation_reminder_sent, include_in_networth, is_encumbered, encumbrance_amount_paise, is_collateral_eligible, collateral_ltv_pct, is_active, is_verified, verified_by, verified_at, ai_risk_level, ai_liquidity_score, ai_category_label, ai_summary, ai_suggestions, ai_enriched_at, notes, tags, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.manual_assets ENABLE TRIGGER ALL;

--
-- Data for Name: manual_asset_value_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.manual_asset_value_history DISABLE TRIGGER ALL;

COPY public.manual_asset_value_history (id, asset_id, user_id, previous_value_paise, new_value_paise, change_paise, change_pct, reason, valuation_method, updated_at) FROM stdin;
\.


ALTER TABLE public.manual_asset_value_history ENABLE TRIGGER ALL;

--
-- Data for Name: merchant_category_map; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.merchant_category_map DISABLE TRIGGER ALL;

COPY public.merchant_category_map (id, user_id, merchant_name, category, subcategory, category_group, confidence, times_seen, user_confirmed, last_seen_at, created_at) FROM stdin;
\.


ALTER TABLE public.merchant_category_map ENABLE TRIGGER ALL;

--
-- Data for Name: monthly_spend_summary; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.monthly_spend_summary DISABLE TRIGGER ALL;

COPY public.monthly_spend_summary (id, user_id, month, category, category_group, total_paise, transaction_count, avg_per_tx_paise, largest_tx_paise, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.monthly_spend_summary ENABLE TRIGGER ALL;

--
-- Data for Name: net_worth_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.net_worth_history DISABLE TRIGGER ALL;

COPY public.net_worth_history (id, user_id, net_worth, recorded_at) FROM stdin;
b37cbb7d-981c-4111-9db5-8e109da68e68	dddc9844-5d6f-4ce7-8765-687e8703c1ff	0.00	2026-08-23 20:09:39.94365+05:45
28d6cc49-ac30-44c0-97fc-705e73f28689	3e6a8df6-add6-4d20-8392-f452b8ceddc3	27325000.50	2026-08-23 20:19:48.402062+05:45
\.


ALTER TABLE public.net_worth_history ENABLE TRIGGER ALL;

--
-- Data for Name: networth_monthly; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.networth_monthly DISABLE TRIGGER ALL;

COPY public.networth_monthly (id, user_id, month, total_paise, bank_paise, investments_paise, land_paise, created_at, updated_at) FROM stdin;
5d427331-933d-4383-938a-28481d6941a0	dddc9844-5d6f-4ce7-8765-687e8703c1ff	2026-08-01	2353825000	605000	2720000	2350000000	2026-08-23 20:10:49.843863+05:45	2026-08-23 23:05:19.168965+05:45
1dc6fcc5-84e9-4cf5-a416-bb71d982dbe3	3e6a8df6-add6-4d20-8392-f452b8ceddc3	2026-08-01	2353825000	605000	2720000	2350000000	2026-08-23 20:10:35.602771+05:45	2026-08-23 23:05:19.285653+05:45
\.


ALTER TABLE public.networth_monthly ENABLE TRIGGER ALL;

--
-- Data for Name: nomination_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.nomination_requests DISABLE TRIGGER ALL;

COPY public.nomination_requests (id, user_id, platform, asset_ref, payload_encrypted, status, job_id, tracking_id, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.nomination_requests ENABLE TRIGGER ALL;

--
-- Data for Name: nominee_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.nominee_profiles DISABLE TRIGGER ALL;

COPY public.nominee_profiles (id, user_id, nominee_name_enc, nominee_dob_enc, relationship, relationship_label, nominee_mobile_enc, nominee_email_enc, nominee_address_enc, nominee_aadhaar_hash, is_minor, guardian_name_enc, guardian_relation, guardian_mobile_enc, allocation_pct, priority_order, is_active, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.nominee_profiles ENABLE TRIGGER ALL;

--
-- Data for Name: nominee_status; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.nominee_status DISABLE TRIGGER ALL;

COPY public.nominee_status (id, user_id, account_ref, institution_name, fi_type, has_nominee, nominee_name_enc, last_checked_at, created_at, updated_at) FROM stdin;
a4148b5b-7b74-4a85-b0fa-b791e59c6a10	3e6a8df6-add6-4d20-8392-f452b8ceddc3	XXXX1234	HDFC Bank	DEPOSIT	f	\N	2026-08-23 20:06:17.439899+05:45	2026-08-23 20:06:17.439899+05:45	2026-08-23 20:06:17.439899+05:45
ff3bde98-d16c-49ad-8c07-3c7e83407d80	3e6a8df6-add6-4d20-8392-f452b8ceddc3	XXXX8877	State Bank of India	DEPOSIT	f	\N	2026-08-23 20:06:17.442981+05:45	2026-08-23 20:06:17.442981+05:45	2026-08-23 20:06:17.442981+05:45
7e9128cf-ef64-43e8-8b7c-d8c7da0a87a5	3e6a8df6-add6-4d20-8392-f452b8ceddc3	DMAT-XXXX9999	Zerodha Broking	EQUITY	f	\N	2026-08-23 20:06:17.443472+05:45	2026-08-23 20:06:17.443472+05:45	2026-08-23 20:06:17.443472+05:45
d6912f8a-b8fd-4b75-988b-16569d57bc96	3e6a8df6-add6-4d20-8392-f452b8ceddc3	FOLIO-XXXX5555	Groww	MUTUAL_FUND	f	\N	2026-08-23 20:06:17.443978+05:45	2026-08-23 20:06:17.443978+05:45	2026-08-23 20:06:17.443978+05:45
51dfbeed-7efc-4537-b401-3fe40492ee08	3e6a8df6-add6-4d20-8392-f452b8ceddc3	POL-XXXX2222	LIC of India	INSURANCE_POLICIES	f	\N	2026-08-23 20:06:17.444487+05:45	2026-08-23 20:06:17.444487+05:45	2026-08-23 20:06:17.444487+05:45
715cbe0a-1f55-44e7-8652-19fc15f65bf3	3e6a8df6-add6-4d20-8392-f452b8ceddc3	PRAN-XXXX4411	NSDL CRA	NPS	f	\N	2026-08-23 20:06:17.444926+05:45	2026-08-23 20:06:17.444926+05:45	2026-08-23 20:06:17.444926+05:45
dff0607f-de8d-4000-b6c4-c0e568f47eae	dddc9844-5d6f-4ce7-8765-687e8703c1ff	XXXX1234	HDFC Bank	DEPOSIT	f	\N	2026-08-23 20:10:42.14462+05:45	2026-08-23 20:10:42.14462+05:45	2026-08-23 20:10:42.14462+05:45
b86f66e8-d807-43a7-b3eb-f2ce0be4e906	dddc9844-5d6f-4ce7-8765-687e8703c1ff	XXXX8877	State Bank of India	DEPOSIT	f	\N	2026-08-23 20:10:42.146227+05:45	2026-08-23 20:10:42.146227+05:45	2026-08-23 20:10:42.146227+05:45
4695d9bd-d487-4262-980e-1db407483438	dddc9844-5d6f-4ce7-8765-687e8703c1ff	DMAT-XXXX9999	Zerodha Broking	EQUITY	f	\N	2026-08-23 20:10:42.14671+05:45	2026-08-23 20:10:42.14671+05:45	2026-08-23 20:10:42.14671+05:45
1d808394-2920-4245-a333-ac7b7b8e42cf	dddc9844-5d6f-4ce7-8765-687e8703c1ff	FOLIO-XXXX5555	Groww	MUTUAL_FUND	f	\N	2026-08-23 20:10:42.14732+05:45	2026-08-23 20:10:42.14732+05:45	2026-08-23 20:10:42.14732+05:45
edbeffd0-3e21-4ea9-aa82-b1e2de4cdc03	dddc9844-5d6f-4ce7-8765-687e8703c1ff	POL-XXXX2222	LIC of India	INSURANCE_POLICIES	f	\N	2026-08-23 20:10:42.14797+05:45	2026-08-23 20:10:42.14797+05:45	2026-08-23 20:10:42.14797+05:45
49ddad88-6ec7-4014-96ed-bcf8bd1119e8	dddc9844-5d6f-4ce7-8765-687e8703c1ff	PRAN-XXXX4411	NSDL CRA	NPS	f	\N	2026-08-23 20:10:42.148519+05:45	2026-08-23 20:10:42.148519+05:45	2026-08-23 20:10:42.148519+05:45
\.


ALTER TABLE public.nominee_status ENABLE TRIGGER ALL;

--
-- Data for Name: nominee_update_batches; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.nominee_update_batches DISABLE TRIGGER ALL;

COPY public.nominee_update_batches (id, user_id, nominee_profile_ids, status, total_accounts, completed_accounts, failed_accounts, pending_accounts, initiated_at, completed_at, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.nominee_update_batches ENABLE TRIGGER ALL;

--
-- Data for Name: nominee_update_tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.nominee_update_tasks DISABLE TRIGGER ALL;

COPY public.nominee_update_tasks (id, batch_id, user_id, canonical_asset_id, institution_name, institution_type, account_ref_enc, folio_number_enc, update_method, status, session_url, session_expires_at, user_opened_at, user_completed_at, api_response, email_sent_at, email_message_id, form_s3_key, pre_update_nominee, post_update_nominee, verified_at, verification_attempts, next_verify_at, error_message, retry_count, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.nominee_update_tasks ENABLE TRIGGER ALL;

--
-- Data for Name: nominee_task_timeline; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.nominee_task_timeline DISABLE TRIGGER ALL;

COPY public.nominee_task_timeline (id, task_id, user_id, event, description, metadata, created_at) FROM stdin;
\.


ALTER TABLE public.nominee_task_timeline ENABLE TRIGGER ALL;

--
-- Data for Name: pending_2fa_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.pending_2fa_sessions DISABLE TRIGGER ALL;

COPY public.pending_2fa_sessions (id, user_id, session_token, ip_address, user_agent, expires_at, is_used, created_at) FROM stdin;
\.


ALTER TABLE public.pending_2fa_sessions ENABLE TRIGGER ALL;

--
-- Data for Name: plans; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.plans DISABLE TRIGGER ALL;

COPY public.plans (id, name, slug, price_monthly_paise, price_yearly_paise, price_display_monthly, price_display_yearly, savings_pct, razorpay_monthly_plan_id, razorpay_yearly_plan_id, tagline, is_popular, is_active, display_order, limit_land_parcels, limit_networth_months, limit_pdf_reports_pm, limit_unclaimed_searches_py, limit_family_members, limit_will_allocations, limit_property_valuations_pm, limit_ai_messages_pm, limit_api_calls_pm, created_at) FROM stdin;
free	Free	free	0	0	₹0	₹0	0	\N	\N	Discover what you own	f	t	1	3	3	1	1	4	0	0	0	0	2026-07-22 12:23:17.079853+05:45
b2b	Business	b2b	0	0	Custom	Custom	0	\N	\N	For law firms, NBFCs and wealth managers	f	t	4	\N	\N	\N	\N	4	\N	\N	\N	\N	2026-07-22 12:23:17.079853+05:45
plus	Plus	plus	19900	179900	₹199/mo	₹1,799/yr	25	plan_TOR3sIT1soMKtZ	plan_TOR3sjtoV3xLV5	For serious financial health	t	t	2	\N	24	\N	\N	4	5	0	0	0	2026-07-22 12:23:17.079853+05:45
pro	Pro	pro	49900	449900	₹499/mo	₹4,499/yr	25	plan_TOR3t2sEdmtER8	plan_TOR3tJcv3xDVow	For complete financial control	f	t	3	\N	\N	\N	\N	4	\N	3	50	100	2026-07-22 12:23:17.079853+05:45
\.


ALTER TABLE public.plans ENABLE TRIGGER ALL;

--
-- Data for Name: plan_features; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.plan_features DISABLE TRIGGER ALL;

COPY public.plan_features (id, plan_id, feature_key, is_enabled) FROM stdin;
69fe45f7-d34d-493e-b268-17493ae07bf3	free	asset_dashboard	t
360c3096-8697-410a-834b-35d56b1359d0	free	land_records	t
3d62d263-bf4c-4738-8345-fb65f4362ac8	free	nominee_checker	t
89cf7f56-77d6-4439-8185-de325169fac0	free	dormant_finder	t
608a329f-5238-45e2-8e51-b779632f47dc	free	networth_tracker	t
2ee7e684-23b1-43fe-b7b1-47d805578924	free	email_alerts	t
dbed139a-2116-440c-9e50-012c7f089d00	free	unclaimed_search	t
b955be14-07af-4deb-a377-21fea8517231	free	success_fee_recovery	t
f91650e9-a9dc-49de-aad9-5117cf65fe07	free	pdf_report	t
d9ef573a-d3fe-4205-9478-cb1e89c7966e	free	sms_alerts	f
e8ccfba5-482a-4fef-a98f-20e59ebee714	free	push_alerts	f
ea7b41fd-3f50-417b-af01-fc01c8ec6e58	free	digilocker_vault	f
41a55dfb-0774-48d3-8d24-5bdb345a8e57	free	will_builder	f
1cb2d939-47f3-48d7-9121-6f81eb0ec944	free	nri_cross_border	f
7060f041-1bac-4108-b443-c75f07c232a3	free	ai_advisor	f
9bc69175-95a2-4665-8a38-52a42b475061	free	credit_score	f
f9178099-e183-46d0-8a39-99c683d56ed5	free	tax_filing	f
c22f3d5a-07d5-4a5a-9659-f6f237090ed5	free	property_valuation	f
a7c13046-616c-4547-b164-0ee119aeb914	free	loan_scoring	f
2afaf591-2812-495c-b8e2-8fa0138e955a	free	api_access	f
4a8fa228-0e64-4195-a080-53ab0991d6df	free	spend_analyser	f
f479c077-db3d-4621-a321-24886f4a07ab	free	subscription_detector	f
be8332f7-d8d2-46a3-afa8-af2eab478428	plus	asset_dashboard	t
0e0aa8cc-9c14-4a80-a25b-10e517ac2ebe	plus	land_records	t
3d027dbe-acc3-48fc-aab4-ca71f25395c5	plus	nominee_checker	t
f9fb6f83-c9be-467b-ab27-3f7277cc6210	plus	dormant_finder	t
0cb07028-79ad-4ca1-ae49-8350f6a5e3f5	plus	networth_tracker	t
585f60af-6bac-4c6b-bd45-1a256772c02f	plus	email_alerts	t
4fbcf4fd-0b90-48c5-a895-50629ce40f01	plus	sms_alerts	t
558db98a-5717-48ae-82b6-89ecc55d8dd8	plus	push_alerts	t
faef2a5b-cefb-41de-884e-0ea7265b2437	plus	unclaimed_search	t
78eda6c6-4765-4d4f-968f-523340ae7c8a	plus	success_fee_recovery	t
84309fd1-31e8-4347-8558-a8568f1f2601	plus	pdf_report	t
28c55f31-cf6e-4257-a5a0-c9f86a4a3075	plus	digilocker_vault	t
1e8de23a-844a-437e-ada7-f83dd9854b85	plus	will_builder	t
c3273e19-81bd-4de2-ad9d-b941ce7194dc	plus	spend_analyser	t
55e1562a-00ec-4ffd-b314-ee200ecf5468	plus	subscription_detector	t
30192891-5061-468f-bdc7-30c259a5940b	plus	nri_cross_border	f
079b6089-ef81-4e1b-b869-3b093d5bbe7a	plus	ai_advisor	f
5fd12fe1-016e-4c77-9d8c-46fda1789998	plus	credit_score	f
f980a0f9-09da-4692-8156-e04f0259fd3c	plus	tax_filing	f
83443cac-496a-47b4-a337-495040805131	plus	property_valuation	f
4d440e61-8cbf-416a-9ace-f20877fcd75f	plus	loan_scoring	f
ef7db693-0561-441e-b37f-947b1b215ce5	plus	api_access	f
040e903d-de38-4532-86c9-dc5e28ed91b8	pro	asset_dashboard	t
9038d083-dcfc-4ce2-8736-89f5b4365b61	pro	land_records	t
f43ff14f-acfc-459c-a2f3-0ab8d215622a	pro	nominee_checker	t
03d68ee8-b5da-4f6d-b0b3-00d45fa3861b	pro	dormant_finder	t
2218adef-d201-412b-84c3-5f2fb273f928	pro	networth_tracker	t
0af21d9b-0e99-4e07-8d1a-68b8dc004786	pro	email_alerts	t
feb60a8f-070e-4b4b-9c5d-cf4bca440bd0	pro	sms_alerts	t
4bc7a872-2523-42b0-bd1c-3223bcf9a16e	pro	push_alerts	t
fff232c4-96ec-4767-bf5b-657375127965	pro	unclaimed_search	t
29dd8c53-ee43-4ba3-b552-1d87c274df08	pro	success_fee_recovery	t
24c73581-76ae-41e2-ba5f-eae96cf89a14	pro	pdf_report	t
326fb320-4fcd-4285-b533-363a2f26581e	pro	digilocker_vault	t
ee79d363-2f84-46ec-a912-ebf5d4d456fc	pro	will_builder	t
2818540e-58c0-4d01-a45e-aea81749b7fe	pro	spend_analyser	t
55e4f477-a2ca-4d92-a12b-47f9a4aaa6b4	pro	subscription_detector	t
e4fdf48a-9699-4264-b076-9e8aaf78ae59	pro	family_vault	t
5d1c42a3-1336-45d4-8421-d6c5cf6139f2	pro	nri_cross_border	t
651356c6-40b9-4959-8681-e6a285ebd037	pro	ai_advisor	t
6926595e-fa81-4b96-9e0a-dac0d4cb96ca	pro	credit_score	t
52d3bca1-2e23-44e6-8d14-cbc6d1436c87	pro	tax_filing	t
29c28789-c9fa-4150-8791-cf38b5a6fe21	pro	property_valuation	t
94749d17-718a-4e54-be60-0260ac7bc60d	pro	loan_scoring	t
e9f59aa2-2eaa-4b76-b713-29269744f2e8	pro	api_access	t
ffddbb11-10ad-40c3-8e35-b41aee577bbb	b2b	asset_dashboard	t
a36b1dcc-948e-439d-a5c0-0fb87e399f32	b2b	land_records	t
71b6f6fb-c639-4b28-93dc-8c982a4c101f	b2b	nominee_checker	t
ce035f00-a2d1-4cf2-9293-2b38c3f2afb4	b2b	dormant_finder	t
8a7b4ccc-44fd-4629-8e98-27bdebd61318	b2b	networth_tracker	t
3e53549a-bfd5-4030-af15-08615afe9cdb	b2b	all_alerts	t
6df06ccd-d094-4779-9c5f-2aa190b794f3	b2b	unclaimed_search	t
58a86b56-5e7d-4e69-87c0-860a81dda6f3	b2b	success_fee_recovery	t
6fc69cf9-7b25-4f9f-8928-f5224d71821b	b2b	pdf_report	t
5b649d46-4d9e-4a7a-b386-6e6523061eb4	b2b	digilocker_vault	t
6877b0a1-af81-4e08-bf2a-54a6c1d8aa52	b2b	will_builder	t
a0c41feb-c16b-4f87-a0bf-83e0c1d7ed1e	b2b	spend_analyser	t
48bacbfb-0d29-4fb9-bc70-46c3588f2e43	b2b	subscription_detector	t
93959918-fc51-4d24-871d-58d4c26e55da	b2b	family_vault	t
cc034b12-b953-4378-ae51-67ec9b631a3a	b2b	nri_cross_border	t
c5ce0ea7-6a45-480d-b068-6678e0e6c4d4	b2b	ai_advisor	t
63f8ab57-4dc5-4b0c-9c98-e89530963440	b2b	credit_score	t
f5fff77f-a580-4ef9-bf42-675922bdbd07	b2b	tax_filing	t
2543eb90-06c5-46c6-8003-19b8154b0c92	b2b	property_valuation	t
cee2ff15-97cd-4ea1-b5c5-f9f79d99a5d4	b2b	loan_scoring	t
ac1c51ee-cd6a-4b83-b8f8-228add8c48d9	b2b	api_access	t
89100fe9-42bc-46ac-a0b4-a224bf2d4338	b2b	b2b_api	t
f3a1cd49-c7b3-40c0-9e14-1e1d77289647	b2b	white_label_sdk	t
ea0d7193-3c0b-4ae6-9873-99f7125798e9	b2b	multi_client	t
8a609899-ddd7-4276-aa8b-1789faf6d7d0	free	insurance_gap	t
aa8704b6-4539-4aee-969c-cbf3eada8ce5	free	loan_eligibility	t
c570c733-fdba-40e8-9f2f-141290d52a8a	free	family_vault	t
538c1bfc-054c-445b-8bb3-9b50267159c3	plus	family_vault	t
ae5ca2f4-5701-4ea3-bf63-70e00fcb5e04	free	ancestral_search	t
10ba80ac-4c01-47c7-95c0-ffa34d535d63	plus	ancestral_search	t
12de1b81-f779-4454-a8a1-56849fb05922	pro	ancestral_search	t
9aad85a1-5dcf-400b-b6ae-d33395cdbcbc	b2b	ancestral_search	t
5e9d1956-c7a7-4bb5-950b-984631d1f4bd	plus	insurance_gap	t
5b861acb-60f1-4a28-8914-5d71641002cc	plus	loan_eligibility	t
bdf5948f-5516-47e3-bf39-f6a8492eb7b7	pro	insurance_gap	t
c8ac519a-12ac-4a9b-a2c0-f34671542876	pro	loan_eligibility	t
c9d43e07-c571-427f-be31-cb20387f622a	b2b	insurance_gap	t
ade4974a-c03f-44a5-8bb0-f264ac3cdb37	b2b	loan_eligibility	t
\.


ALTER TABLE public.plan_features ENABLE TRIGGER ALL;

--
-- Data for Name: promo_codes; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.promo_codes DISABLE TRIGGER ALL;

COPY public.promo_codes (id, code, description, discount_pct, applicable_plans, max_uses, uses_count, valid_from, valid_until, is_active, created_at) FROM stdin;
\.


ALTER TABLE public.promo_codes ENABLE TRIGGER ALL;

--
-- Data for Name: recovery_cases; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.recovery_cases DISABLE TRIGGER ALL;

COPY public.recovery_cases (id, user_id, recovery_type, asset_description, institution_name, estimated_value_paise, confirmed_value_paise, recovered_value_paise, folio_number_enc, policy_number_enc, uan_number_enc, account_number_enc, isin, srn_number, claim_reference, status, initiated_at, submitted_at, estimated_completion, completed_at, last_status_update, fee_pct, fee_amount_paise, fee_agreement_signed_at, fee_collected_at, fee_payment_id, submission_ref, nodal_officer_name, nodal_officer_email, company_rta, internal_notes, rejection_reason, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.recovery_cases ENABLE TRIGGER ALL;

--
-- Data for Name: recovery_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.recovery_documents DISABLE TRIGGER ALL;

COPY public.recovery_documents (id, case_id, user_id, doc_type, doc_label, is_required, is_received, is_verified, s3_key, file_name, file_size_bytes, mime_type, uploaded_at, verified_at, verified_by, digilocker_uri, auto_fetched, notes, created_at) FROM stdin;
\.


ALTER TABLE public.recovery_documents ENABLE TRIGGER ALL;

--
-- Data for Name: recovery_fee_agreements; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.recovery_fee_agreements DISABLE TRIGGER ALL;

COPY public.recovery_fee_agreements (id, case_id, user_id, fee_pct, estimated_fee_paise, agreement_text, user_ip, user_agent, signed_at, is_active) FROM stdin;
\.


ALTER TABLE public.recovery_fee_agreements ENABLE TRIGGER ALL;

--
-- Data for Name: recovery_notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.recovery_notifications DISABLE TRIGGER ALL;

COPY public.recovery_notifications (id, case_id, user_id, channel, title, body, sent_at) FROM stdin;
\.


ALTER TABLE public.recovery_notifications ENABLE TRIGGER ALL;

--
-- Data for Name: recovery_revenue; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.recovery_revenue DISABLE TRIGGER ALL;

COPY public.recovery_revenue (id, case_id, user_id, recovery_type, recovered_paise, fee_pct, fee_paise, gst_paise, total_charged_paise, payment_id, payment_method, created_at) FROM stdin;
\.


ALTER TABLE public.recovery_revenue ENABLE TRIGGER ALL;

--
-- Data for Name: recovery_timeline; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.recovery_timeline DISABLE TRIGGER ALL;

COPY public.recovery_timeline (id, case_id, user_id, from_status, to_status, title, description, is_user_visible, created_at) FROM stdin;
\.


ALTER TABLE public.recovery_timeline ENABLE TRIGGER ALL;

--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.refresh_tokens DISABLE TRIGGER ALL;

COPY public.refresh_tokens (id, user_id, token_hash, expires_at, created_at, revoked_at) FROM stdin;
\.


ALTER TABLE public.refresh_tokens ENABLE TRIGGER ALL;

--
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.reports DISABLE TRIGGER ALL;

COPY public.reports (id, user_id, s3_key, report_type, generated_at) FROM stdin;
\.


ALTER TABLE public.reports ENABLE TRIGGER ALL;

--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.sessions DISABLE TRIGGER ALL;

COPY public.sessions (id, user_id, session_id, role, ip_address, user_agent, created_at, last_seen_at, revoked_at) FROM stdin;
\.


ALTER TABLE public.sessions ENABLE TRIGGER ALL;

--
-- Data for Name: spend_insights; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.spend_insights DISABLE TRIGGER ALL;

COPY public.spend_insights (id, user_id, month, insight_type, title, body, amount_paise, category, action_label, action_url, is_read, created_at) FROM stdin;
\.


ALTER TABLE public.spend_insights ENABLE TRIGGER ALL;

--
-- Data for Name: user_subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.user_subscriptions DISABLE TRIGGER ALL;

COPY public.user_subscriptions (id, user_id, plan_id, billing_cycle, status, razorpay_subscription_id, razorpay_customer_id, razorpay_plan_id, trial_ends_at, current_period_start, current_period_end, cancelled_at, cancel_at_period_end, expires_at, price_paise, currency, promo_code, discount_pct, created_at, updated_at) FROM stdin;
84bf0217-0ab1-4d4e-8cfd-847b6c93d6c7	dddc9844-5d6f-4ce7-8765-687e8703c1ff	pro	monthly	active	\N	\N	\N	\N	\N	2027-08-23 20:16:33.821447+05:45	\N	f	\N	29900	INR	\N	0	2026-08-23 20:16:33.821447+05:45	2026-08-23 20:16:33.821447+05:45
9bbecc98-2225-43bf-855b-73062869f6c1	3e6a8df6-add6-4d20-8392-f452b8ceddc3	pro	monthly	active	\N	\N	\N	\N	\N	2027-08-23 23:03:11.835851+05:45	\N	f	\N	29900	INR	\N	0	2026-08-23 23:03:11.835851+05:45	2026-08-23 23:03:11.835851+05:45
\.


ALTER TABLE public.user_subscriptions ENABLE TRIGGER ALL;

--
-- Data for Name: subscription_payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.subscription_payments DISABLE TRIGGER ALL;

COPY public.subscription_payments (id, subscription_id, user_id, razorpay_payment_id, razorpay_invoice_id, amount_paise, gst_paise, total_paise, status, payment_method, invoice_s3_key, paid_at, created_at) FROM stdin;
\.


ALTER TABLE public.subscription_payments ENABLE TRIGGER ALL;

--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.transactions DISABLE TRIGGER ALL;

COPY public.transactions (id, account_id, user_id, txn_id, date, narration, type, amount, balance_after, currency, category, reference, created_at) FROM stdin;
5dfb2cd9-b4ba-48e3-9e81-aba5e4bf096b	b0cf0f03-aa41-4911-93aa-374cfc4b0caf	3e6a8df6-add6-4d20-8392-f452b8ceddc3	\N	2026-08-23 20:06:17.419+05:45	Incremental Sync Credit	CREDIT	5000.00	\N	INR	\N	\N	2026-08-23 20:06:17.420327+05:45
98ec0e51-082e-4b0b-8953-68b6a05c8634	b0cf0f03-aa41-4911-93aa-374cfc4b0caf	3e6a8df6-add6-4d20-8392-f452b8ceddc3	\N	2026-08-23 20:06:17.419+05:45	Incremental Sync Debit	DEBIT	1200.00	\N	INR	\N	\N	2026-08-23 20:06:17.420327+05:45
4e37a79a-797c-47bc-a90a-201bbc8bb37d	00ec2532-8589-470f-aa00-321ea64c188b	3e6a8df6-add6-4d20-8392-f452b8ceddc3	\N	2026-08-23 20:06:17.425+05:45	Incremental Sync Credit	CREDIT	5000.00	\N	INR	\N	\N	2026-08-23 20:06:17.426312+05:45
137ad3c4-3758-4227-a75c-22bef8394a8c	00ec2532-8589-470f-aa00-321ea64c188b	3e6a8df6-add6-4d20-8392-f452b8ceddc3	\N	2026-08-23 20:06:17.425+05:45	Incremental Sync Debit	DEBIT	1200.00	\N	INR	\N	\N	2026-08-23 20:06:17.426312+05:45
4299f8a4-3dac-4ec0-b502-e97199d3b671	2c18e6c5-7a2b-42b9-98c9-650fd23ed4da	dddc9844-5d6f-4ce7-8765-687e8703c1ff	\N	2026-08-23 20:10:42.126+05:45	Incremental Sync Credit	CREDIT	5000.00	\N	INR	\N	\N	2026-08-23 20:10:42.12814+05:45
97d4ef9d-7ffc-4907-8509-8838a7f44f90	2c18e6c5-7a2b-42b9-98c9-650fd23ed4da	dddc9844-5d6f-4ce7-8765-687e8703c1ff	\N	2026-08-23 20:10:42.126+05:45	Incremental Sync Debit	DEBIT	1200.00	\N	INR	\N	\N	2026-08-23 20:10:42.12814+05:45
364f4fe5-4844-4167-88b8-78155edcfdde	2b2598b6-9740-473f-a7a1-950b77db23da	dddc9844-5d6f-4ce7-8765-687e8703c1ff	\N	2026-08-23 20:10:42.132+05:45	Incremental Sync Credit	CREDIT	5000.00	\N	INR	\N	\N	2026-08-23 20:10:42.134078+05:45
f0666427-45c1-43e6-9e55-9b3cd7171dc1	2b2598b6-9740-473f-a7a1-950b77db23da	dddc9844-5d6f-4ce7-8765-687e8703c1ff	\N	2026-08-23 20:10:42.132+05:45	Incremental Sync Debit	DEBIT	1200.00	\N	INR	\N	\N	2026-08-23 20:10:42.134078+05:45
\.


ALTER TABLE public.transactions ENABLE TRIGGER ALL;

--
-- Data for Name: trusted_devices; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.trusted_devices DISABLE TRIGGER ALL;

COPY public.trusted_devices (id, user_id, device_token_hash, device_name, ip_address, last_used_at, expires_at, created_at, device_type, browser, os, is_active, trusted_at) FROM stdin;
\.


ALTER TABLE public.trusted_devices ENABLE TRIGGER ALL;

--
-- Data for Name: two_factor_audit_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.two_factor_audit_log DISABLE TRIGGER ALL;

COPY public.two_factor_audit_log (id, user_id, event, method, ip_address, user_agent, metadata, created_at) FROM stdin;
\.


ALTER TABLE public.two_factor_audit_log ENABLE TRIGGER ALL;

--
-- Data for Name: two_factor_backup_codes; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.two_factor_backup_codes DISABLE TRIGGER ALL;

COPY public.two_factor_backup_codes (id, user_id, code_hash, is_used, used_at, used_ip, created_at) FROM stdin;
\.


ALTER TABLE public.two_factor_backup_codes ENABLE TRIGGER ALL;

--
-- Data for Name: unclaimed_assets; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.unclaimed_assets DISABLE TRIGGER ALL;

COPY public.unclaimed_assets (id, user_id, asset_type, estimated_value, source_institution, status, created_at) FROM stdin;
93ac4b94-ccd7-40da-ac89-994b581fccf8	3e6a8df6-add6-4d20-8392-f452b8ceddc3	Provident Fund	350000.00	EPFO	pending	2026-08-23 20:06:17.464478+05:45
6320f446-2e38-41b3-8cfc-ec20370d622c	3e6a8df6-add6-4d20-8392-f452b8ceddc3	Mutual Fund	120000.00	SBI Mutual Fund	pending	2026-08-23 20:06:17.464478+05:45
159452ea-82de-4d58-9bf2-e003dbf50e52	dddc9844-5d6f-4ce7-8765-687e8703c1ff	Provident Fund	350000.00	EPFO	pending	2026-08-23 20:06:17.464478+05:45
f8d44073-fb28-4fcb-ad2c-e0722f8c978b	dddc9844-5d6f-4ce7-8765-687e8703c1ff	Mutual Fund	120000.00	SBI Mutual Fund	pending	2026-08-23 20:06:17.464478+05:45
\.


ALTER TABLE public.unclaimed_assets ENABLE TRIGGER ALL;

--
-- Data for Name: unclaimed_search_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.unclaimed_search_requests DISABLE TRIGGER ALL;

COPY public.unclaimed_search_requests (id, user_id, pan_enc, aadhaar_hash, name_enc, payment_id, amount_paid_paise, payment_status, search_status, searched_at, completed_at, created_at) FROM stdin;
\.


ALTER TABLE public.unclaimed_search_requests ENABLE TRIGGER ALL;

--
-- Data for Name: unclaimed_assets_found; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.unclaimed_assets_found DISABLE TRIGGER ALL;

COPY public.unclaimed_assets_found (id, search_id, user_id, source, asset_type, company_name, folio_number_enc, amount_paise, claim_ref, claim_url, claim_process, documents_needed, is_claimed, claimed_at, raw_response_enc, created_at) FROM stdin;
\.


ALTER TABLE public.unclaimed_assets_found ENABLE TRIGGER ALL;

--
-- Data for Name: user_alerts; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.user_alerts DISABLE TRIGGER ALL;

COPY public.user_alerts (id, user_id, alert_type, severity, title, body, metadata, is_read, read_at, sms_sent, sms_sent_at, push_sent, push_sent_at, email_sent, email_sent_at, created_at) FROM stdin;
e7beeb05-a787-4b13-8498-7efe9be444f3	3e6a8df6-add6-4d20-8392-f452b8ceddc3	nominee_missing	warning	6 accounts have no nominee	6 of your linked accounts have no nominee. RBI mandates nominee registration by Dec 2025. Update now to protect your family.	{"withNominee": 0, "withoutNominee": 6}	f	\N	f	\N	f	\N	f	\N	2026-08-23 20:06:17.447778+05:45
c34fc7a7-d932-4fe2-bdcf-216a9f7bbbe3	dddc9844-5d6f-4ce7-8765-687e8703c1ff	nominee_missing	warning	6 accounts have no nominee	6 of your linked accounts have no nominee. RBI mandates nominee registration by Dec 2025. Update now to protect your family.	{"withNominee": 0, "withoutNominee": 6}	f	\N	f	\N	f	\N	f	\N	2026-08-23 20:10:42.151816+05:45
\.


ALTER TABLE public.user_alerts ENABLE TRIGGER ALL;

--
-- Data for Name: user_two_factor; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.user_two_factor DISABLE TRIGGER ALL;

COPY public.user_two_factor (user_id, is_enabled, method, totp_secret_enc, pending_totp_secret, totp_verified, otp_code_hash, otp_sent_at, otp_expires_at, created_at, updated_at, enabled_at, setup_completed_at, last_used_at, last_used_method, disabled_at) FROM stdin;
\.


ALTER TABLE public.user_two_factor ENABLE TRIGGER ALL;

--
-- Data for Name: wills; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.wills DISABLE TRIGGER ALL;

COPY public.wills (id, user_id, testator_name_enc, testator_dob_enc, testator_address_enc, testator_pan_enc, testator_aadhaar_hash, will_version, status, title, executor_name_enc, executor_relation, executor_mobile_enc, alt_executor_name_enc, pdf_s3_key, pdf_generated_at, esign_ref, esign_status, esign_completed_at, subscription_id, subscription_plan, subscription_valid_until, witness1_name_enc, witness1_address_enc, witness2_name_enc, witness2_address_enc, notes, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.wills ENABLE TRIGGER ALL;

--
-- Data for Name: will_allocations; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.will_allocations DISABLE TRIGGER ALL;

COPY public.will_allocations (id, will_id, user_id, asset_type, asset_ref_id, asset_description, estimated_value_paise, beneficiary_name_enc, beneficiary_relation, beneficiary_mobile_enc, beneficiary_aadhaar_hash, allocation_pct, condition_text, is_contingent, contingent_beneficiary_name_enc, notes, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.will_allocations ENABLE TRIGGER ALL;

--
-- Data for Name: will_beneficiaries; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.will_beneficiaries DISABLE TRIGGER ALL;

COPY public.will_beneficiaries (id, will_id, user_id, name_enc, relation, dob_enc, mobile_enc, email_enc, address_enc, aadhaar_hash, pan_enc, created_at) FROM stdin;
\.


ALTER TABLE public.will_beneficiaries ENABLE TRIGGER ALL;

--
-- PostgreSQL database dump complete
--

\unrestrict EBxeH5epSpveEZQ5wuMof8WRGHGX6xUF9zUEaH7pB9FfV6iCUmYVxhyJH0icZ7I


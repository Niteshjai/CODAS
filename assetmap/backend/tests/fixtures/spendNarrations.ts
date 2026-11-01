// Labelled evaluation set for the spend classifier: realistic Indian bank narrations
// (UPI / NEFT / IMPS / NACH / ACH / ECS / POS / ATM / BBPS formats). Names, VPAs and reference
// numbers are invented. `expected` is the category a careful human would choose.
// Entries marked `deterministicCanKnow: false` are genuinely ambiguous from the narration alone
// (unknown local businesses): the deterministic layers should abstain (send to review), not guess.

export interface LabelledNarration {
  narration: string
  amountPaise: number
  type: 'debit' | 'credit'
  date: string
  expected: string
  deterministicCanKnow?: boolean
}

export const SPEND_NARRATIONS: LabelledNarration[] = [
  // Food & groceries
  { narration: 'UPI/DR/412345678901/SWIGGY/YESB/swiggy.stores@ybl/Payment from Ph', amountPaise: 45_000, type: 'debit', date: '2026-10-03', expected: 'FOOD' },
  { narration: 'UPI-ZOMATO LTD-zomato-order@paytm-PYTM0123456-412398765432-Order', amountPaise: 62_000, type: 'debit', date: '2026-10-04', expected: 'FOOD' },
  { narration: 'UPI/DR/412311112222/Blinkit/ICIC/blinkit.payu@icici/UPI', amountPaise: 89_000, type: 'debit', date: '2026-10-05', expected: 'FOOD' },
  { narration: 'POS 416021XXXXXX4321 DMART AVENUE SUPERMARTS 23456 DT 051126', amountPaise: 312_000, type: 'debit', date: '2026-10-05', expected: 'FOOD' },
  { narration: 'UPI/DR/413322221111/BIGBASKET/HDFC/bigbasket@hdfcbank/Order', amountPaise: 154_000, type: 'debit', date: '2026-10-06', expected: 'FOOD' },
  { narration: 'POS 416021XXXXXX4321 STARBUCKS COFFEE MUMBAI', amountPaise: 38_000, type: 'debit', date: '2026-10-07', expected: 'FOOD' },
  { narration: 'UPI/DR/412300001234/Zepto Marketplace/YESB/zeptonow@ybl/Payment', amountPaise: 41_000, type: 'debit', date: '2026-10-08', expected: 'FOOD' },
  { narration: 'ECOM PUR/DOMINOS PIZZA/0412345', amountPaise: 55_900, type: 'debit', date: '2026-10-09', expected: 'FOOD' },

  // Income
  { narration: 'NEFT-HDFCN52026110112345-ACME TECHNOLOGIES PVT LTD-SALARY NOV 2026', amountPaise: 8_500_000, type: 'credit', date: '2026-10-01', expected: 'SALARY' },
  { narration: 'SAL CR NOV26 INFOSYS LIMITED', amountPaise: 9_200_000, type: 'credit', date: '2026-10-31', expected: 'SALARY' },
  { narration: 'NEFT CR-CITI0000001-TCS LTD-PAYROLL', amountPaise: 7_800_000, type: 'credit', date: '2026-10-01', expected: 'SALARY' },
  { narration: 'INT.PD:01-08-2026 TO 31-10-2026', amountPaise: 123_400, type: 'credit', date: '2026-10-31', expected: 'INVESTMENT_RETURN' },
  { narration: 'ACH C- INFOSYS LTD-DIVIDEND-123456', amountPaise: 210_000, type: 'credit', date: '2026-10-20', expected: 'INVESTMENT_RETURN' },
  { narration: 'UPI/CR/412344445555/AMAZON PAY/YESB/amazonpay@apl/Refund', amountPaise: 129_900, type: 'credit', date: '2026-10-12', expected: 'REFUNDS' },

  // Rent & housing
  { narration: 'UPI/DR/412398761234/RAMESH KUMAR/SBIN/ramesh.k@oksbi/RENT NOV', amountPaise: 2_500_000, type: 'debit', date: '2026-10-02', expected: 'RENT' },
  { narration: 'IMPS/P2A/412312341234/SUNITA SHARMA/HDFC/House rent October', amountPaise: 1_800_000, type: 'debit', date: '2026-10-03', expected: 'RENT' },
  { narration: 'UPI/DR/412300002222/NOBROKER/HDFC/nobroker.rent@hdfcbank/Rent payment', amountPaise: 2_200_000, type: 'debit', date: '2026-10-04', expected: 'RENT' },
  { narration: 'UPI/DR/412300002323/GREENWOOD APARTMENT OWNERS ASSN/ICIC/gwoa@icici/Society maintenance Q3', amountPaise: 900_000, type: 'debit', date: '2026-10-05', expected: 'RENT' },

  // Transfers (people, self, credit-card bills)
  { narration: 'UPI/DR/412355556666/ANIL MEHTA/ICIC/anil.mehta@okicici/Payment', amountPaise: 150_000, type: 'debit', date: '2026-10-10', expected: 'TRANSFERS' },
  { narration: 'UPI/CR/412377778888/PRIYA NAIR/UTIB/priya.n@okaxis/dinner split', amountPaise: 80_000, type: 'credit', date: '2026-10-11', expected: 'TRANSFERS' },
  { narration: 'IMPS/P2A/412399990000/SELF/HDFC/Own account transfer', amountPaise: 5_000_000, type: 'debit', date: '2026-10-12', expected: 'TRANSFERS' },
  { narration: 'NEFT-SBIN0001234-SELF-TRANSFER TO OWN ACCOUNT', amountPaise: 2_000_000, type: 'credit', date: '2026-10-12', expected: 'TRANSFERS' },
  { narration: 'BIL/ONL/000123456/HDFC CREDIT CARD/CC PAYMENT', amountPaise: 4_350_000, type: 'debit', date: '2026-10-15', expected: 'TRANSFERS' },
  { narration: 'UPI/DR/412322223333/CRED CLUB/YESB/cred.club@axisb/Credit card bill', amountPaise: 2_100_000, type: 'debit', date: '2026-10-16', expected: 'TRANSFERS' },
  { narration: 'UPI/CR/412366660000/VIKRAM SINGH/KKBK/vikram9@okhdfcbank/UPI', amountPaise: 300_000, type: 'credit', date: '2026-10-17', expected: 'TRANSFERS' },

  // EMIs
  { narration: 'NACH/ACH DR/BAJAJ FINANCE LTD/EMI 012345678', amountPaise: 1_250_000, type: 'debit', date: '2026-10-05', expected: 'EMI' },
  { narration: 'ACH D- HDFC BANK LTD-HOME LOAN EMI-0045', amountPaise: 3_400_000, type: 'debit', date: '2026-10-05', expected: 'EMI' },
  { narration: 'NACH DR TATA CAPITAL FINANCIAL SERVICES LTD 9876543', amountPaise: 880_000, type: 'debit', date: '2026-10-07', expected: 'EMI' },
  { narration: 'ECS/ICICI BANK/CAR LOAN EMI/DEC', amountPaise: 1_560_000, type: 'debit', date: '2026-10-10', expected: 'EMI' },

  // Investments
  { narration: 'NACH/ACH DR/BSE STAR MF/SIP 1234567', amountPaise: 500_000, type: 'debit', date: '2026-10-05', expected: 'INVESTMENTS' },
  { narration: 'ACH D- ICICI PRUDENTIAL MF-SIP-AB12345', amountPaise: 300_000, type: 'debit', date: '2026-10-10', expected: 'INVESTMENTS' },
  { narration: 'UPI/DR/412300004444/Zerodha Broking/HDFC/zerodhabroking@hdfcbank/Fund', amountPaise: 2_000_000, type: 'debit', date: '2026-10-11', expected: 'INVESTMENTS' },
  { narration: 'UPI/DR/412300005555/GROWW/YESB/groww.brk@validicici/SIP', amountPaise: 100_000, type: 'debit', date: '2026-10-12', expected: 'INVESTMENTS' },
  { narration: 'INB/NPS TRUST/PRAN CONTRIBUTION', amountPaise: 500_000, type: 'debit', date: '2026-10-13', expected: 'INVESTMENTS' },

  // Insurance
  { narration: 'NACH/ACH DR/LIC OF INDIA/PREMIUM 1234', amountPaise: 410_000, type: 'debit', date: '2026-10-08', expected: 'INSURANCE' },
  { narration: 'BIL/BPAY/000234567/HDFC LIFE INSURANCE/Premium', amountPaise: 1_200_000, type: 'debit', date: '2026-10-09', expected: 'INSURANCE' },
  { narration: 'UPI/DR/412366667777/STAR HEALTH AND ALLIED/HDFC/starhealth@hdfcbank/Policy', amountPaise: 2_450_000, type: 'debit', date: '2026-10-10', expected: 'INSURANCE' },

  // Bills (BBPS) and telecom
  { narration: 'BBPS/BESCOM/ELECTRICITY BILL/412312345', amountPaise: 184_000, type: 'debit', date: '2026-10-12', expected: 'BILLS' },
  { narration: 'BIL/BPAY/000345678/MSEDCL/Electricity', amountPaise: 221_000, type: 'debit', date: '2026-10-12', expected: 'BILLS' },
  { narration: 'UPI/DR/412311223344/Adani Electricity Mumbai/HDFC/adanielectricity@hdfcbank/Bill', amountPaise: 265_000, type: 'debit', date: '2026-10-13', expected: 'BILLS' },
  { narration: 'BBPS/MAHANAGAR GAS LTD/GAS BILL', amountPaise: 78_000, type: 'debit', date: '2026-10-14', expected: 'BILLS' },
  { narration: 'BBPS/BWSSB/WATER BILL/0012', amountPaise: 42_000, type: 'debit', date: '2026-10-14', expected: 'BILLS' },
  { narration: 'UPI/DR/412355554444/AIRTEL/AIRP/airtelpredirect@airtel/Recharge', amountPaise: 71_900, type: 'debit', date: '2026-10-15', expected: 'RECHARGE' },
  { narration: 'BBPS/JIO PREPAID/RECHARGE/9876543210', amountPaise: 29_900, type: 'debit', date: '2026-10-15', expected: 'RECHARGE' },
  { narration: 'UPI/DR/412300006666/ACT FIBERNET/ICIC/actfibernet@icici/Broadband', amountPaise: 117_000, type: 'debit', date: '2026-10-16', expected: 'RECHARGE' },

  // Subscriptions
  { narration: 'POS 416021XXXXXX4321 NETFLIX.COM', amountPaise: 64_900, type: 'debit', date: '2026-10-17', expected: 'SUBSCRIPTIONS' },
  { narration: 'UPI/DR/412377770000/Spotify India/YESB/spotify@ybl/Mandate', amountPaise: 11_900, type: 'debit', date: '2026-10-18', expected: 'SUBSCRIPTIONS' },
  { narration: 'ECOM PUR/GOOGLE ONE/0412', amountPaise: 13_000, type: 'debit', date: '2026-10-18', expected: 'SUBSCRIPTIONS' },
  { narration: 'POS 416021XXXXXX4321 AMAZON PRIME MEMBERSHIP', amountPaise: 149_900, type: 'debit', date: '2026-10-19', expected: 'SUBSCRIPTIONS' },

  // Shopping
  { narration: 'POS 416021XXXXXX4321 AMAZON.IN 23456 DT 011126', amountPaise: 249_900, type: 'debit', date: '2026-10-20', expected: 'SHOPPING' },
  { narration: 'UPI/DR/412312312312/FLIPKART INTERNET/AXIS/flipkart@axisbank/Order', amountPaise: 189_900, type: 'debit', date: '2026-10-20', expected: 'SHOPPING' },
  { narration: 'UPI/DR/412300007777/Myntra Designs/HDFC/myntra@hdfcbank/Payment', amountPaise: 159_900, type: 'debit', date: '2026-10-21', expected: 'SHOPPING' },
  { narration: 'POS 416021XXXXXX4321 CROMA RETAIL BANGALORE', amountPaise: 2_499_900, type: 'debit', date: '2026-10-21', expected: 'SHOPPING' },

  // Travel & fuel
  { narration: 'UPI/DR/412300008888/UBER INDIA/HDFC/uber@hdfcbank/Trip', amountPaise: 32_000, type: 'debit', date: '2026-10-22', expected: 'TRAVEL' },
  { narration: 'POS 416021XXXXXX4321 HPCL PETROL PUMP KORAMANGALA', amountPaise: 300_000, type: 'debit', date: '2026-10-22', expected: 'TRAVEL' },
  { narration: 'POS 416021XXXXXX4321 INDIAN OIL FUEL STATION', amountPaise: 250_000, type: 'debit', date: '2026-10-23', expected: 'TRAVEL' },
  { narration: 'UPI/DR/412300009999/IRCTC/SBIN/irctc@sbi/Ticket', amountPaise: 184_500, type: 'debit', date: '2026-10-23', expected: 'TRAVEL' },
  { narration: 'UPI/DR/412311110000/OLA/YESB/olacabs@ybl/Ride', amountPaise: 27_500, type: 'debit', date: '2026-10-24', expected: 'TRAVEL' },
  { narration: 'ECOM PUR/MAKEMYTRIP INDIA/FLIGHT', amountPaise: 845_000, type: 'debit', date: '2026-10-24', expected: 'TRAVEL' },

  // Health
  { narration: 'POS 416021XXXXXX4321 APOLLO PHARMACY JAYANAGAR', amountPaise: 86_000, type: 'debit', date: '2026-10-25', expected: 'HEALTH' },
  { narration: 'UPI/DR/412322220000/MEDPLUS HEALTH SERVICES/ICIC/medplus@icici/Medicines', amountPaise: 43_000, type: 'debit', date: '2026-10-25', expected: 'HEALTH' },
  { narration: 'UPI/DR/412333330000/PHARMEASY/YESB/pharmeasy@ybl/Order', amountPaise: 112_000, type: 'debit', date: '2026-10-26', expected: 'HEALTH' },
  { narration: 'POS 416021XXXXXX4321 DR LAL PATHLABS', amountPaise: 150_000, type: 'debit', date: '2026-10-26', expected: 'HEALTH' },

  // Education, giving, entertainment
  { narration: 'NEFT-ICIC0000123-DELHI PUBLIC SCHOOL-SCHOOL FEE Q3', amountPaise: 4_500_000, type: 'debit', date: '2026-10-27', expected: 'EDUCATION' },
  { narration: 'UPI/DR/412300001111/BYJUS/HDFC/byjus@hdfcbank/Course', amountPaise: 1_200_000, type: 'debit', date: '2026-10-27', expected: 'EDUCATION' },
  { narration: 'UPI/DR/412300003333/AKSHAYA PATRA FOUNDATION/HDFC/akshayapatra@hdfcbank/Donation', amountPaise: 200_000, type: 'debit', date: '2026-10-28', expected: 'CHARITY' },
  { narration: 'UPI/DR/412300004321/BOOKMYSHOW/ICIC/bookmyshow@icici/Movie tickets', amountPaise: 96_000, type: 'debit', date: '2026-10-28', expected: 'PARTY' },
  { narration: 'POS 416021XXXXXX4321 PVR CINEMAS FORUM MALL', amountPaise: 72_000, type: 'debit', date: '2026-10-29', expected: 'PARTY' },

  // Cash and bank fees
  { narration: 'ATM WDL/ATM ID S1BW012345/MUMBAI ANDHERI', amountPaise: 1_000_000, type: 'debit', date: '2026-10-29', expected: 'ATM' },
  { narration: 'NWD-416021XXXXXX4321-SBIN0012345-PUNE', amountPaise: 500_000, type: 'debit', date: '2026-10-30', expected: 'ATM' },
  { narration: 'SMS ALERT CHRG FOR QTR ENDED SEP26', amountPaise: 1_770, type: 'debit', date: '2026-10-30', expected: 'BANK_CHARGES' },
  { narration: 'DEBIT CARD ANNUAL FEE + GST', amountPaise: 70_800, type: 'debit', date: '2026-10-30', expected: 'BANK_CHARGES' },

  // Genuinely ambiguous from the narration alone → should go to review, not be guessed
  { narration: 'UPI/DR/412300001212/SRI VENKATESHWARA ENTERPRISES/SBIN/q123456789@ybl/Payment', amountPaise: 34_000, type: 'debit', date: '2026-10-30', expected: 'FOOD', deterministicCanKnow: false },
  { narration: 'POS 416021XXXXXX4321 SHREE BALAJI MEDICALS', amountPaise: 46_000, type: 'debit', date: '2026-10-31', expected: 'HEALTH', deterministicCanKnow: false },
]

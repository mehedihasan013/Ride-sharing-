export interface BhairabLandmarkData {
  id: string;
  englishName: string;
  banglaName: string;
  category: 'transit_hub' | 'bridge' | 'commercial' | 'hospital' | 'residential';
  latitude: number;
  longitude: number;
  descriptionBangla: string;
}

export const BHAIRAB_LANDMARKS: BhairabLandmarkData[] = [
  {
    id: 'bhairab-rail-station',
    englishName: 'Bhairab Bazar Railway Junction',
    banglaName: 'ভৈরব বাজার রেলওয়ে জংশন',
    category: 'transit_hub',
    latitude: 24.0487,
    longitude: 90.9852,
    descriptionBangla: 'ভৈরব এর প্রধান ট্রেন স্টেশন, ঢাকা-চট্টগ্রাম-সিলেট রেলওয়ে সংযোগ',
  },
  {
    id: 'meghna-bridge-point',
    englishName: 'Syed Nazrul Islam Bridge (Meghna Bridge)',
    banglaName: 'সৈয়দ নজরুল ইসলাম সেতু (মেঘনা ব্রিজ গোলচত্বর)',
    category: 'bridge',
    latitude: 24.0418,
    longitude: 91.0022,
    descriptionBangla: 'আশুগঞ্জ ও সিলেট হাইওয়ে প্রবেশদ্বার',
  },
  {
    id: 'bhairab-bus-stand',
    englishName: 'Bhairab Central Bus Stand (Kachari Mor)',
    banglaName: 'ভৈরব বাস টার্মিনাল (কাচারি মোড়)',
    category: 'transit_hub',
    latitude: 24.0535,
    longitude: 90.9811,
    descriptionBangla: 'ঢাকা-কিশোরগঞ্জ বাস এবং মাইক্রোবাস কাউন্টার',
  },
  {
    id: 'bhairab-bazar-ghat',
    englishName: 'Bhairab Bazar Old River Ghat',
    banglaName: 'ভৈরব বাজার পুরাতন নদী ঘাট',
    category: 'commercial',
    latitude: 24.0425,
    longitude: 90.9840,
    descriptionBangla: 'মেঘনা নদী তীরবর্তী প্রধান পাইকারি বাজার ও ট্রলার ঘাট',
  },
  {
    id: 'chandiber-mor',
    englishName: 'Chandiber Mor & Upazila Hospital',
    banglaName: 'চণ্ডীবের মোড় (উপজেলা স্বাস্থ্য কমপ্লেক্স)',
    category: 'hospital',
    latitude: 24.0620,
    longitude: 90.9785,
    descriptionBangla: 'ভৈরব ৫০ শয্যা বিশিষ্ট হাসপাতাল ও আবাসিক এলাকা',
  },
  {
    id: 'shimulkandi-mor',
    englishName: 'Shimulkandi Mor',
    banglaName: 'শিমুলকান্দি মোড়',
    category: 'residential',
    latitude: 24.0750,
    longitude: 90.9650,
    descriptionBangla: 'ভৈরব-কুলিয়ারচর আঞ্চলিক সড়ক সংযোগ',
  },
];

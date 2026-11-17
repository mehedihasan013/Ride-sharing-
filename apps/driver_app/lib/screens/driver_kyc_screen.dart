import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/driver_socket_service.dart';

class DriverKycScreen extends StatefulWidget {
  const DriverKycScreen({super.key});

  @override
  State<DriverKycScreen> createState() => _DriverKycScreenState();
}

class _DriverKycScreenState extends State<DriverKycScreen> {
  final _formKey = GlobalKey<FormState>();

  late TextEditingController _nameController;
  late TextEditingController _phoneController;
  late TextEditingController _nidController;
  late TextEditingController _vehicleModelController;
  late TextEditingController _registrationController;
  late TextEditingController _councilorCertController;
  late TextEditingController _brtaLicenseController;

  String _selectedVehicleType = 'EASYBIKE';
  bool _isSubmitting = false;
  String? _submissionFeedbackBangla;

  static const List<Map<String, dynamic>> _vehicleOptions = [
    {
      'code': 'EASYBIKE',
      'titleBangla': 'ইজিবাইক / টমটম',
      'subtitleBangla': 'ভৈরব পৌরসভা ও ইউনিয়ন রুট',
      'icon': Icons.electric_rickshaw,
    },
    {
      'code': 'CNG',
      'titleBangla': 'সিএনজি',
      'subtitleBangla': 'ভৈরব-কুলিয়ারচর-বাজিতপুর রুট',
      'icon': Icons.airport_shuttle,
    },
    {
      'code': 'BIKE',
      'titleBangla': 'মোটরবাইক',
      'subtitleBangla': 'দ্রুত একক যাত্রী পরিবহন',
      'icon': Icons.two_wheeler,
    },
    {
      'code': 'CAR_MICROBUS',
      'titleBangla': 'কার / মাইক্রোবাস',
      'subtitleBangla': 'ঢাকা-সিলেট-ভৈরব হাইওয়ে ও রিজার্ভ',
      'icon': Icons.directions_car,
    },
  ];

  @override
  void initState() {
    super.initState();
    final profile = context.read<DriverSocketService>().profile;
    _selectedVehicleType = profile.vehicleType;
    _nameController = TextEditingController(text: profile.driverName);
    _phoneController = TextEditingController(text: profile.driverPhone);
    _nidController = TextEditingController(text: profile.nidNumber);
    _vehicleModelController = TextEditingController(text: profile.vehicleModel);
    _registrationController =
        TextEditingController(text: profile.registrationNumber);
    _councilorCertController = TextEditingController(
      text: profile.unionCouncilorCert ??
          'ভৈরব পৌরসভা ওয়ার্ড নং ৪ প্রত্যয়নপত্র #৮৯২',
    );
    _brtaLicenseController = TextEditingController(
      text: profile.brtaLicenseNo?.isNotEmpty == true
          ? profile.brtaLicenseNo
          : 'DK-04981122-BRTA',
    );
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _nidController.dispose();
    _vehicleModelController.dispose();
    _registrationController.dispose();
    _councilorCertController.dispose();
    _brtaLicenseController.dispose();
    super.dispose();
  }

  bool get _requiresCouncilorCert =>
      _selectedVehicleType == 'EASYBIKE' || _selectedVehicleType == 'CNG';

  void _onVehicleTypeSelected(String code) {
    setState(() {
      _selectedVehicleType = code;
      switch (code) {
        case 'EASYBIKE':
          _vehicleModelController.text = 'ভৈরব ইজিবাইক (টমটম) #১২';
          _registrationController.text = 'ভৈরব-পৌর-ইজিবাইক-০১২৪';
          break;
        case 'CNG':
          _vehicleModelController.text = 'বাজাজ সিএনজি অটোরিকশা';
          _registrationController.text = 'কিশোরগঞ্জ-থ-১১-৩৪২১';
          break;
        case 'BIKE':
          _vehicleModelController.text = 'বাজাজ পালসার ১৫০ সিসি';
          _registrationController.text = 'ঢাকা মেট্রো-ল-৪৫-৮৮১২';
          break;
        case 'CAR_MICROBUS':
          _vehicleModelController.text = 'টয়োটা নোয়াহ মাইক্রোবাস (ঢাকা-ভৈরব)';
          _registrationController.text = 'ঢাকা মেট্রো-চ-১৯-৭৭৩১';
          break;
      }
    });
  }

  Future<void> _submitKycForm(DriverSocketService socketService) async {
    if (!(_formKey.currentState?.validate() ?? false)) return;

    setState(() {
      _isSubmitting = true;
      _submissionFeedbackBangla = null;
    });

    try {
      final result = await socketService.submitKycApplication(
        driverName: _nameController.text.trim(),
        driverPhone: _phoneController.text.trim(),
        vehicleType: _selectedVehicleType,
        vehicleModel: _vehicleModelController.text.trim(),
        registrationNumber: _registrationController.text.trim(),
        nidNumber: _nidController.text.trim(),
        unionCouncilorCert: _requiresCouncilorCert
            ? _councilorCertController.text.trim()
            : null,
        brtaLicenseNo: !_requiresCouncilorCert
            ? _brtaLicenseController.text.trim()
            : null,
      );

      if (mounted) {
        setState(() {
          _submissionFeedbackBangla = result.messageBangla;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFF006A4E),
            content: Text('✓ ${result.messageBangla}'),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final socketService = context.watch<DriverSocketService>();
    final profile = socketService.profile;

    return Form(
      key: _formKey,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // 1. Current Verification Status Banner
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFEFFAF5),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: const Color(0xFF006A4E).withOpacity(0.4),
                width: 1.5,
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: const BoxDecoration(
                    color: Color(0xFF006A4E),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.verified_user,
                    color: Colors.white,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'কেওয়াইসি স্ট্যাটাস: ${profile.kycStatus == 'APPROVED' ? 'অনুমোদিত (VERIFIED)' : profile.kycStatus}',
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 15,
                          color: Color(0xFF006A4E),
                        ),
                      ),
                      const SizedBox(height: 3),
                      const Text(
                        'ভৈরব টিয়ার্ড ভেরিফিকেশন নীতিমালা: ইজিবাইক/সিএনজি চালকদের জন্য ওয়ার্ড কাউন্সিলর প্রত্যয়নপত্র এবং বাইক/কারের জন্য বিআরটিএ লাইসেন্স প্রযোজ্য।',
                        style: TextStyle(fontSize: 12, color: Colors.black87),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // 2. Vehicle Category Selector (4 Bhairab Modes)
          const Text(
            '১. আপনার বাহনের ধরন নির্বাচন করুন (Vehicle Type)',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
          ),
          const SizedBox(height: 10),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _vehicleOptions.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
              childAspectRatio: 2.1,
            ),
            itemBuilder: (context, index) {
              final opt = _vehicleOptions[index];
              final code = opt['code'] as String;
              final isSelected = _selectedVehicleType == code;
              return InkWell(
                borderRadius: BorderRadius.circular(14),
                onTap: () => _onVehicleTypeSelected(code),
                child: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? const Color(0xFF006A4E).withOpacity(0.12)
                        : Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: isSelected
                          ? const Color(0xFF006A4E)
                          : Colors.grey.shade300,
                      width: isSelected ? 2 : 1,
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        opt['icon'] as IconData,
                        color: isSelected
                            ? const Color(0xFF006A4E)
                            : Colors.grey.shade700,
                        size: 26,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              opt['titleBangla'] as String,
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                                color: isSelected
                                    ? const Color(0xFF006A4E)
                                    : Colors.black87,
                              ),
                            ),
                            Text(
                              opt['subtitleBangla'] as String,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontSize: 10.5,
                                color: Colors.black54,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 18),

          // 3. Personal & Vehicle Identity Fields
          Card(
            elevation: 1,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    '২. চালক ও বাহনের তথ্য (Driver & Vehicle Info)',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                  ),
                  const SizedBox(height: 14),
                  TextFormField(
                    controller: _nameController,
                    decoration: const InputDecoration(
                      labelText: 'চালকের পূর্ণ নাম (Full Name)',
                      prefixIcon: Icon(Icons.person_outline),
                      border: OutlineInputBorder(),
                    ),
                    validator: (v) =>
                        (v == null || v.trim().isEmpty) ? 'নাম লিখুন' : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _phoneController,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(
                      labelText: 'মোবাইল নম্বর (Phone Number)',
                      prefixIcon: Icon(Icons.phone_android),
                      border: OutlineInputBorder(),
                    ),
                    validator: (v) => (v == null || v.trim().length < 11)
                        ? '১১ ডিজিটের মোবাইল নম্বর দিন'
                        : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _nidController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'জাতীয় পরিচয়পত্র নম্বর (NID Number)',
                      prefixIcon: Icon(Icons.badge_outlined),
                      border: OutlineInputBorder(),
                    ),
                    validator: (v) => (v == null || v.trim().length < 10)
                        ? 'সঠিক এনআইডি নম্বর দিন'
                        : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _vehicleModelController,
                    decoration: const InputDecoration(
                      labelText: 'গাড়ির মডেল / বিবরণ (Vehicle Model)',
                      prefixIcon: Icon(Icons.directions_bus_outlined),
                      border: OutlineInputBorder(),
                    ),
                    validator: (v) => (v == null || v.trim().isEmpty)
                        ? 'গাড়ির মডেল লিখুন'
                        : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _registrationController,
                    decoration: const InputDecoration(
                      labelText:
                          'পৌরসভা টোকেন বা রেজিস্ট্রেশন নম্বর (Registration / Token)',
                      prefixIcon: Icon(Icons.confirmation_number_outlined),
                      border: OutlineInputBorder(),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // 4. Dynamic Tiered Document Field (Ward Councilor Certificate vs BRTA Driving License)
          Card(
            elevation: 2,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
              side: BorderSide(
                color: _requiresCouncilorCert
                    ? const Color(0xFF006A4E)
                    : const Color(0xFFF59E0B),
                width: 1.5,
              ),
            ),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        _requiresCouncilorCert
                            ? Icons.account_balance
                            : Icons.credit_card,
                        color: _requiresCouncilorCert
                            ? const Color(0xFF006A4E)
                            : const Color(0xFFD97706),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _requiresCouncilorCert
                              ? '৩. ওয়ার্ড কাউন্সিলর প্রত্যয়নপত্র (ভৈরব পৌরসভা / ইউনিয়ন পরিষদ)'
                              : '৩. বিআরটিএ ড্রাইভিং লাইসেন্স (BRTA Driving License)',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 14.5,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    _requiresCouncilorCert
                        ? 'ভৈরবের স্থানীয় ইজিবাইক/টমটম ও সিএনজি চালকদের সহজ নিবন্ধনের জন্য বিআরটিএ লাইসেন্সের পরিবর্তে ওয়ার্ড কাউন্সিলর বা ইউনিয়ন চেয়ারম্যানের প্রত্যয়নপত্র গ্রহণ করা হয়।'
                        : 'মোটরবাইক এবং কার/মাইক্রোবাস চালকদের জন্য বৈধ বিআরটিএ ড্রাইভিং লাইসেন্স নম্বর আবশ্যক।',
                    style: const TextStyle(fontSize: 12, color: Colors.black54),
                  ),
                  const SizedBox(height: 12),
                  if (_requiresCouncilorCert)
                    TextFormField(
                      controller: _councilorCertController,
                      decoration: const InputDecoration(
                        labelText:
                            'ওয়ার্ড কাউন্সিলর প্রত্যয়নপত্র নম্বর / রেফারেন্স',
                        hintText:
                            'ভৈরব পৌরসভা ওয়ার্ড নং ৪ প্রত্যয়নপত্র #৮৯২',
                        prefixIcon: Icon(Icons.verified_outlined),
                        border: OutlineInputBorder(),
                      ),
                      validator: (v) => (v == null || v.trim().isEmpty)
                          ? 'ওয়ার্ড কাউন্সিলর প্রত্যয়নপত্র তথ্য দিন'
                          : null,
                    )
                  else
                    TextFormField(
                      controller: _brtaLicenseController,
                      decoration: const InputDecoration(
                        labelText:
                            'বিআরটিএ ড্রাইভিং লাইসেন্স নম্বর (BRTA License No)',
                        hintText: 'DK-04981122-BRTA',
                        prefixIcon: Icon(Icons.card_membership),
                        border: OutlineInputBorder(),
                      ),
                      validator: (v) => (v == null || v.trim().isEmpty)
                          ? 'বিআরটিএ ড্রাইভিং লাইসেন্স নম্বর দিন'
                          : null,
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          if (_submissionFeedbackBangla != null) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFEFFAF5),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF006A4E)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.check_circle, color: Color(0xFF006A4E)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _submissionFeedbackBangla!,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF006A4E),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
          ],

          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFF006A4E),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 15),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              onPressed: _isSubmitting
                  ? null
                  : () => _submitKycForm(socketService),
              icon: _isSubmitting
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Icon(Icons.cloud_upload),
              label: Text(
                _isSubmitting
                    ? 'যাচাই করা হচ্ছে...'
                    : 'কেওয়াইসি ও গাড়ির তথ্য জমা দিন (Submit KYC)',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 15,
                ),
              ),
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}

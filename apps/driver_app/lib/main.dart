import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'screens/driver_kyc_screen.dart';
import 'screens/driver_radar_screen.dart';
import 'screens/driver_wallet_screen.dart';
import 'services/bangla_voice_service.dart';
import 'services/driver_api_service.dart';
import 'services/driver_socket_service.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const CholoBhairabDriverApp());
}

class CholoBhairabDriverApp extends StatelessWidget {
  const CholoBhairabDriverApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider<BanglaVoiceService>(
          create: (_) => BanglaVoiceService(),
        ),
        Provider<DriverApiService>(
          create: (_) => DriverApiService(baseUrl: 'http://localhost:4000'),
        ),
        ChangeNotifierProxyProvider2<DriverApiService, BanglaVoiceService,
            DriverSocketService>(
          create: (ctx) => DriverSocketService(
            apiService: ctx.read<DriverApiService>(),
            voiceService: ctx.read<BanglaVoiceService>(),
            serverUrl: 'http://localhost:4000',
          ),
          update: (_, api, voice, previous) =>
              previous ??
              DriverSocketService(
                apiService: api,
                voiceService: voice,
                serverUrl: 'http://localhost:4000',
              ),
        ),
      ],
      child: MaterialApp(
        title: 'চলো ভৈরব - চালক অ্যাপ',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          useMaterial3: true,
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFF006A4E),
            primary: const Color(0xFF006A4E),
            secondary: const Color(0xFFE2136E),
          ),
          scaffoldBackgroundColor: const Color(0xFFF4F7F6),
          appBarTheme: const AppBarTheme(
            backgroundColor: Color(0xFF006A4E),
            foregroundColor: Colors.white,
            elevation: 0,
          ),
        ),
        home: const DriverHomeShell(),
      ),
    );
  }
}

class DriverHomeShell extends StatefulWidget {
  const DriverHomeShell({super.key});

  @override
  State<DriverHomeShell> createState() => _DriverHomeShellState();
}

class _DriverHomeShellState extends State<DriverHomeShell> {
  int _selectedIndex = 0;

  @override
  Widget build(BuildContext context) {
    final socketService = context.watch<DriverSocketService>();
    final voiceService = context.watch<BanglaVoiceService>();
    final wallet = socketService.wallet;

    final screens = <Widget>[
      DriverRadarScreen(
        onOpenWalletTab: () => setState(() => _selectedIndex = 1),
      ),
      const DriverWalletScreen(),
      const DriverKycScreen(),
      const DriverVoiceAlertsTab(),
    ];

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'চলো ভৈরব • চালক (CholoBhairab Driver)',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
            ),
            Text(
              '${socketService.profile.driverName} • ${socketService.profile.currentLandmarkBangla}',
              style: const TextStyle(fontSize: 11.5, color: Colors.white70),
            ),
          ],
        ),
        actions: [
          // Quick Wallet Balance Pill in AppBar
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 10),
            child: InkWell(
              borderRadius: BorderRadius.circular(20),
              onTap: () => setState(() => _selectedIndex = 1),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: wallet.isLockedOut
                      ? const Color(0xFFF42A41)
                      : Colors.white.withOpacity(0.18),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  children: [
                    Icon(
                      wallet.isLockedOut
                          ? Icons.lock
                          : Icons.account_balance_wallet,
                      size: 14,
                      color: Colors.white,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '৳${wallet.currentBalance.toStringAsFixed(0)}',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 12.5,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          IconButton(
            tooltip: voiceService.isMuted
                ? 'বাংলা ভয়েস আনমিউট করুন'
                : 'বাংলা ভয়েস মিউট করুন',
            onPressed: voiceService.toggleMute,
            icon: Icon(
              voiceService.isMuted ? Icons.volume_off : Icons.volume_up,
            ),
          ),
        ],
      ),
      body: screens[_selectedIndex],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (idx) => setState(() => _selectedIndex = idx),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.radar_outlined),
            selectedIcon: Icon(Icons.radar),
            label: 'ট্রিপ রাডার • Radar',
          ),
          NavigationDestination(
            icon: Icon(Icons.account_balance_wallet_outlined),
            selectedIcon: Icon(Icons.account_balance_wallet),
            label: 'বিকাশ ওয়ালেট • Wallet',
          ),
          NavigationDestination(
            icon: Icon(Icons.verified_user_outlined),
            selectedIcon: Icon(Icons.verified_user),
            label: 'কেওয়াইসি ও গাড়ি • KYC',
          ),
          NavigationDestination(
            icon: Icon(Icons.record_voice_over_outlined),
            selectedIcon: Icon(Icons.record_voice_over),
            label: 'ভয়েস লগ • Voice Alerts',
          ),
        ],
      ),
    );
  }
}

class DriverVoiceAlertsTab extends StatelessWidget {
  const DriverVoiceAlertsTab({super.key});

  @override
  Widget build(BuildContext context) {
    final voiceService = context.watch<BanglaVoiceService>();
    final history = voiceService.history;
    final bars = voiceService.currentWaveformHeights;
    final timeFormat = DateFormat('hh:mm:ss a');

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // 1. Voice Waveform & Mute Control Hero Card
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: const Color(0xFF0B131E),
            borderRadius: BorderRadius.circular(18),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Row(
                    children: [
                      Icon(
                        Icons.spatial_audio_off,
                        color: Color(0xFF10B981),
                        size: 24,
                      ),
                      SizedBox(width: 8),
                      Text(
                        'বাংলা ভয়েস রাইড অ্যানাউন্সার',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  FilledButton.tonalIcon(
                    style: FilledButton.styleFrom(
                      backgroundColor: voiceService.isMuted
                          ? const Color(0xFFF42A41)
                          : const Color(0xFF006A4E),
                      foregroundColor: Colors.white,
                    ),
                    onPressed: voiceService.toggleMute,
                    icon: Icon(
                      voiceService.isMuted ? Icons.volume_off : Icons.volume_up,
                      size: 18,
                    ),
                    label: Text(voiceService.isMuted ? 'মিউট আছে' : 'সক্রিয় আছে'),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              // Waveform Bars
              Container(
                height: 54,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  color: const Color(0xFF111C2D),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: bars
                      .map(
                        (h) => AnimatedContainer(
                          duration: const Duration(milliseconds: 160),
                          width: 8,
                          height: 44 * h,
                          decoration: BoxDecoration(
                            color: voiceService.isSpeaking
                                ? const Color(0xFF10B981)
                                : Colors.white24,
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                      )
                      .toList(),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                voiceService.isSpeaking
                    ? '🔊 এখন বাজছে: "${voiceService.activePromptBangla}"'
                    : 'ভৈরবের ইজিবাইক ও সিএনজি চালকদের সুবিধার্থে প্রতিটি ট্রিপ অফার বাংলায় পড়ে শোনানো হয়।',
                style: const TextStyle(color: Colors.white70, fontSize: 12.5),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // 2. Quick Test Preset Prompts
        Card(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'বাংলা ভয়েস প্রম্পট টেস্ট করুন (Tap to Speak)',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                ),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    ActionChip(
                      avatar: const Icon(
                        Icons.notifications_active,
                        size: 16,
                        color: Color(0xFF006A4E),
                      ),
                      label: const Text('নতুন ট্রিপ রিকোয়েস্ট (৳৮০)'),
                      onPressed: () => voiceService.speakRideOpportunity(
                        BanglaVoiceService.sampleRidePromptBangla,
                      ),
                    ),
                    ActionChip(
                      avatar: const Icon(
                        Icons.check_circle,
                        size: 16,
                        color: Color(0xFF006A4E),
                      ),
                      label: const Text('রাইড কনফার্ম ভয়েস'),
                      onPressed: () => voiceService.speakRideConfirmed(),
                    ),
                    ActionChip(
                      avatar: const Icon(
                        Icons.warning_amber,
                        size: 16,
                        color: Color(0xFFF42A41),
                      ),
                      label: const Text('কম ব্যালেন্স সতর্কবার্তা'),
                      onPressed: () => voiceService.speakLowBalanceWarning(),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),

        // 3. Voice Transcript History List
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'সাম্প্রতিক বাংলা ভয়েস ট্রান্সক্রিপ্ট লগ',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
            ),
            if (history.isNotEmpty)
              TextButton(
                onPressed: voiceService.clearHistory,
                child: const Text('মুছে ফেলুন'),
              ),
          ],
        ),
        const SizedBox(height: 6),
        ...history.map((item) {
          return Card(
            margin: const EdgeInsets.only(bottom: 10),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: const Color(0xFF006A4E).withOpacity(0.12),
                child: const Icon(
                  Icons.record_voice_over,
                  color: Color(0xFF006A4E),
                  size: 20,
                ),
              ),
              title: Text(
                item.textBangla,
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 13.5,
                ),
              ),
              subtitle: Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  '${item.categoryTitleBangla} • ${timeFormat.format(item.timestamp)}',
                  style: const TextStyle(fontSize: 11.5),
                ),
              ),
              trailing: IconButton(
                tooltip: 'পুনরায় শুনুন',
                onPressed: () => voiceService.replay(
                  item.textBangla,
                  category: item.category,
                ),
                icon: const Icon(Icons.replay_circle_filled, color: Color(0xFF006A4E)),
              ),
            ),
          );
        }),
      ],
    );
  }
}

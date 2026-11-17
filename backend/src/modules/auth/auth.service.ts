import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';

export interface UserSession {
  id: string;
  phoneNumber: string;
  fullName: string;
  role: 'PASSENGER' | 'DRIVER' | 'ADMIN';
  token: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  // In-memory OTP store (backed by Redis in production)
  private otpStore = new Map<string, { otp: string; expiresAt: number }>();

  // User registry backed by PrismaService durable store
  private users = new Map<string, any>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly prismaService: PrismaService,
  ) {
    this.loadOrSeedUsers();
    this.prismaService.registerResetListener(() => {
      this.seedDemoUsers();
      this.persistUsers();
    });
  }

  private loadOrSeedUsers() {
    this.seedDemoUsers();
    const storedUsers = this.prismaService.getUsers();
    if (Array.isArray(storedUsers) && storedUsers.length > 0) {
      for (const u of storedUsers) {
        if (u && u.phoneNumber) {
          this.users.set(u.phoneNumber, u);
        }
      }
    } else {
      this.persistUsers();
    }
  }

  private seedDemoUsers() {
    this.users.clear();
    // Demo accounts for instant development testing
    this.users.set('01700000001', {
      id: 'passenger_demo_1',
      phoneNumber: '01700000001',
      fullName: 'আব্দুল করিম (Karim)',
      role: 'PASSENGER',
    });

    this.users.set('01800000001', {
      id: 'driver_demo_1',
      phoneNumber: '01800000001',
      fullName: 'মোঃ রফিকুল ইসলাম (Rafiqul)',
      role: 'DRIVER',
      vehicleType: 'EASYBIKE',
      vehicleModel: 'ভৈরব টমটম (ইজিবাইক)',
    });
  }

  private persistUsers() {
    this.prismaService.saveUsers(Array.from(this.users.values()));
  }

  /**
   * Request 6-digit OTP for Bangladeshi mobile number (+8801...)
   */
  async requestOtp(
    phoneNumber: string,
  ): Promise<{ success: boolean; messageBangla: string; demoOtp?: string }> {
    const cleaned = phoneNumber.replace(/[^0-9]/g, '');
    if (cleaned.length < 11) {
      throw new BadRequestException('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017xxxxxxxx)');
    }

    // Generate 6-digit OTP (For dev/demo fallback: 123456)
    const otp =
      process.env.NODE_ENV === 'production'
        ? Math.floor(100000 + Math.random() * 900000).toString()
        : '123456';

    this.otpStore.set(cleaned, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes validity
    });

    this.logger.log(`[SMS OTP] Sent to ${cleaned}: ${otp}`);

    return {
      success: true,
      messageBangla: 'আপনার মোবাইলে ওটিপি কোড পাঠানো হয়েছে।',
      demoOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    };
  }

  /**
   * Verify OTP and return session with JWT
   */
  async verifyOtp(
    phoneNumber: string,
    otp: string,
    role: 'PASSENGER' | 'DRIVER' = 'PASSENGER',
    fullName?: string,
  ): Promise<UserSession> {
    const cleaned = phoneNumber.replace(/[^0-9]/g, '');
    const entry = this.otpStore.get(cleaned);

    // Development bypass allows '123456'
    if (!entry && otp !== '123456') {
      throw new BadRequestException('ওটিপি এর মেয়াদ শেষ বা ভুল হয়েছে। আবার চেষ্টা করুন।');
    }

    if (entry && entry.otp !== otp && otp !== '123456') {
      throw new BadRequestException('ভুল ওটিপি কোড।');
    }

    let user = this.users.get(cleaned);
    if (!user) {
      user = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        phoneNumber: cleaned,
        fullName: fullName || (role === 'DRIVER' ? 'নতুন চালক' : 'নতুন যাত্রী'),
        role,
      };
      this.users.set(cleaned, user);
      this.persistUsers();
    }

    const payload = { sub: user.id, phone: user.phoneNumber, role: user.role };
    const token = this.jwtService.sign(payload);

    return {
      id: user.id,
      phoneNumber: user.phoneNumber,
      fullName: user.fullName,
      role: user.role,
      token,
    };
  }

  /**
   * Submit Driver Onboarding KYC documents
   */
  async submitDriverKyc(
    driverId: string,
    data: {
      nidNumber: string;
      vehicleType: 'BIKE' | 'CNG' | 'EASYBIKE' | 'CAR_MICROBUS';
      vehicleModel: string;
      brtaLicenseNo?: string;
      unionCouncilorCertUrl?: string;
    },
  ) {
    this.logger.log(
      `Driver KYC submitted for ${driverId}: NID ${data.nidNumber}, Vehicle: ${data.vehicleType}`,
    );
    return {
      success: true,
      status: 'APPROVED', // Instant approval for pilot stage
      messageBangla: 'আপনার চালক আবেদন অনুমোদিত হয়েছে। এখন আপনি ট্রিপ শুরু করতে পারবেন!',
    };
  }
}

import { Controller, Get, Post, Body, Param, UseGuards, NotFoundException } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { AdminKeyGuard } from '../../common/admin-key.guard';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get(':driverId')
  getWallet(@Param('driverId') driverId: string) {
    // A read must not mint a new wallet (with its welcome bonus) for any ID a stranger types.
    if (process.env.NODE_ENV === 'production' && !this.walletService.hasWallet(driverId)) {
      throw new NotFoundException('Wallet not found');
    }
    const wallet = this.walletService.getWallet(driverId);
    const transactions = this.walletService.getDriverTransactions(driverId);
    return {
      success: true,
      wallet,
      transactions,
    };
  }

  @UseGuards(AdminKeyGuard)
  @Post('topup/bkash')
  async topupBkash(
    @Body()
    body: {
      driverId: string;
      amountBdt: number;
      trxId: string;
      method?: 'BKASH' | 'NAGAD' | 'ADMIN_MANUAL';
    },
  ) {
    const tx = await this.walletService.topupViaBkash(
      body.driverId,
      body.amountBdt,
      body.trxId || `DEMO_TRX_${Date.now()}`,
      body.method || 'BKASH',
    );
    const wallet = this.walletService.getWallet(body.driverId);
    return {
      success: true,
      transaction: tx,
      wallet,
    };
  }
}

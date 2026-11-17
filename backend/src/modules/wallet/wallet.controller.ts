import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { WalletService } from './wallet.service';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get(':driverId')
  getWallet(@Param('driverId') driverId: string) {
    const wallet = this.walletService.getWallet(driverId);
    const transactions = this.walletService.getDriverTransactions(driverId);
    return {
      success: true,
      wallet,
      transactions,
    };
  }

  @Post('topup/bkash')
  async topupBkash(
    @Body()
    body: {
      driverId: string;
      amountBdt: number;
      trxId: string;
    },
  ) {
    const tx = await this.walletService.topupViaBkash(
      body.driverId,
      body.amountBdt,
      body.trxId || `DEMO_TRX_${Date.now()}`,
    );
    return {
      success: true,
      transaction: tx,
    };
  }
}

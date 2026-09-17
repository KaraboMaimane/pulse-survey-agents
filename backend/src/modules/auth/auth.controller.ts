import { Controller, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { IdentityDto } from '../../shared/dto/identity.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('identities')
  listIdentities(): Promise<IdentityDto[]> {
    return this.authService.listIdentities();
  }
}

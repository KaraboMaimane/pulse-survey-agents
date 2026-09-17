import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { IdentityDto } from '../../shared/dto/identity.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // Local-dev-only: lists every seeded user so the frontend can offer a "pick a
  // user to log in as" selector instead of real authentication. Intentionally
  // unguarded — it is the pre-login entry point.
  async listIdentities(): Promise<IdentityDto[]> {
    const users = await this.userRepository.find({ relations: ['organization'] });

    return users.map((user) => ({
      userId: user.id,
      userName: user.name,
      role: user.role,
      organizationId: user.organizationId,
      organizationName: user.organization.name,
    }));
  }
}

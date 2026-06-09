import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateLeadDto) {
    const lead = await this.prisma.lead.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        name: dto.name?.trim(),
        message: dto.message?.trim(),
        source: dto.source ?? 'contact',
      },
    });
    return { success: true, id: lead.id };
  }

  async findAll() {
    return this.prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}

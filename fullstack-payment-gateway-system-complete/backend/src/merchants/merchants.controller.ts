import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { MerchantsService } from './merchants.service';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../database/entities/user.entity';
import { Merchant } from '../database/entities/merchant.entity';

@ApiTags('Merchants')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN) // Only admins can manage merchants
@Controller('merchants')
export class MerchantsController {
  constructor(private readonly merchantsService: MerchantsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new merchant (Admin only)' })
  @ApiResponse({ status: 201, description: 'Merchant created successfully.', type: Merchant })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  create(@Body() createMerchantDto: CreateMerchantDto) {
    return this.merchantsService.create(createMerchantDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all merchants (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of merchants.', type: [Merchant] })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  findAll() {
    return this.merchantsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a merchant by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'The found merchant.', type: Merchant })
  @ApiResponse({ status: 404, description: 'Merchant not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  findOne(@Param('id') id: string) {
    return this.merchantsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a merchant by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Merchant updated successfully.', type: Merchant })
  @ApiResponse({ status: 404, description: 'Merchant not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  update(@Param('id') id: string, @Body() updateMerchantDto: UpdateMerchantDto) {
    return this.merchantsService.update(id, updateMerchantDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a merchant by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Merchant deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Merchant not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  remove(@Param('id') id: string) {
    return this.merchantsService.remove(id);
  }

  @Post(':id/regenerate-api-keys')
  @ApiOperation({ summary: 'Regenerate API keys for a merchant (Admin only)' })
  @ApiResponse({ status: 200, description: 'API keys regenerated.', type: Merchant })
  @ApiResponse({ status: 404, description: 'Merchant not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  regenerateApiKeys(@Param('id') id: string) {
    return this.merchantsService.regenerateApiKeys(id);
  }
}
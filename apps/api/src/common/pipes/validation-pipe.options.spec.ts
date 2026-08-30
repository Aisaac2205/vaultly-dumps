import { Body, Controller, Get, Module, Post, Query, ValidationPipe } from '@nestjs/common';
import { APP_PIPE, NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { validationPipeOptions } from './validation-pipe.options';

class ProbeBodyDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}

class ProbeQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;
}

@Controller('probe')
class ProbeController {
  @Post()
  create(@Body() body: ProbeBodyDto): { keys: string[] } {
    return { keys: Object.keys(body) };
  }

  @Get()
  list(@Query() query: ProbeQueryDto): { page: number | undefined; pageType: string } {
    return { page: query.page, pageType: typeof query.page };
  }
}

@Module({
  controllers: [ProbeController],
  providers: [
    { provide: APP_PIPE, useValue: new ValidationPipe(validationPipeOptions) },
  ],
})
class ProbeModule {}

describe('global validation pipe options over real HTTP requests', () => {
  let app: NestExpressApplication;
  let baseUrl: string;

  beforeAll(async () => {
    app = await NestFactory.create<NestExpressApplication>(ProbeModule, {
      logger: false,
    });
    await app.listen(0);
    baseUrl = await app.getUrl();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects a body carrying a property the DTO does not declare', async () => {
    const response = await fetch(`${baseUrl}/probe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'erp-prod', isAdmin: true }),
    });

    expect(response.status).toBe(400);

    const payload = (await response.json()) as { message: string[] };
    expect(payload.message).toContain('property isAdmin should not exist');
  });

  it('rejects a query string carrying a parameter the DTO does not declare', async () => {
    const response = await fetch(`${baseUrl}/probe?page=2&limit=10`);

    expect(response.status).toBe(400);

    const payload = (await response.json()) as { message: string[] };
    expect(payload.message).toContain('property limit should not exist');
  });

  it('accepts a body containing only declared properties', async () => {
    const response = await fetch(`${baseUrl}/probe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'erp-prod' }),
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ keys: ['name'] });
  });

  it('still converts query strings to their declared primitive type', async () => {
    const response = await fetch(`${baseUrl}/probe?page=2`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ page: 2, pageType: 'number' });
  });
});

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailTemplate } from '../../models/email-template.model';

@Injectable()
export class EmailTemplateRepository {
  constructor(
    @InjectRepository(EmailTemplate)
    private readonly repo: Repository<EmailTemplate>,
  ) {}

  async findBySlug(slug: string): Promise<EmailTemplate> {
    const template = await this.repo.findOne({ where: { slug } });
    if (!template) {
      throw new NotFoundException(
        `Email template with slug "${slug}" not found`,
      );
    }
    return template;
  }

  async render(
    slug: string,
    variables: Record<string, string>,
  ): Promise<{ subject: string; html: string }> {
    const template = await this.findBySlug(slug);

    let subject = template.subject;
    let html = template.template;

    for (const [key, value] of Object.entries(variables)) {
      subject = subject.replaceAll(`{{${key}}}`, value);
      html = html.replaceAll(`{{${key}}}`, value);
    }

    return { subject, html };
  }
}

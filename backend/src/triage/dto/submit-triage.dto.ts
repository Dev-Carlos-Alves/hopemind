import { IsObject } from 'class-validator';

export class SubmitTriageDto {
  /** Answers keyed by question code (P01, S06...). Content is validated against the questionnaire. */
  @IsObject({ message: 'Envie as respostas do questionário.' })
  answers: Record<string, unknown>;
}

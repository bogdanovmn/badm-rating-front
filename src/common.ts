import { Source, PlayType, TopType } from '@/api';

export const sourceOrder: Source[] = [Source.RNBFJunior, Source.RNBF];
export const playTypeOrder: PlayType[] = [PlayType.MS, PlayType.MD, PlayType.WS, PlayType.WD, PlayType.XD];

export class TopKey {
    constructor(
      private topType: TopType,
      private source: Source,
      private playType: PlayType
    ) {}
  
    value(): string {
      return `${this.topType}_${this.source}_${this.playType}`;
    }
}

export const formatDate = (date: string | undefined): string => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('ru-RU');
};
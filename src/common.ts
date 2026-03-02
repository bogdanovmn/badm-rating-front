import { Source, PlayType, TopType, YearGroup } from '@/api';

export const SOURCE_ORDER: Source[] = [Source.RNBFJunior, Source.RNBF];
export const PLAY_TYPE_ORDER: PlayType[] = [PlayType.MS, PlayType.MD, PlayType.WS, PlayType.WD, PlayType.XD];
export const YEAR_GROUP_ORDER: YearGroup[] = [YearGroup.All, YearGroup.U13, YearGroup.U15, YearGroup.U17, YearGroup.U19]

export class TopKey {
    constructor(
      private topType: TopType,
      private source: Source,
      private playType: PlayType,
      private yearGroup: YearGroup
    ) {}
  
    value(): string {
      return `${this.topType}_${this.source}_${this.playType}_${this.yearGroup}`;
    }
}

export const formatDate = (date: string | undefined | null): string => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('ru-RU');
};
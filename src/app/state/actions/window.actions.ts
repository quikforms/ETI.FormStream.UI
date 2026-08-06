export const WINDOW_OPEN = '[Window] Open';

export class WindowOpen {
  readonly type = WINDOW_OPEN;
  constructor(
    public displayedContent: string,
    public isUrl?: boolean
  ) {}
}

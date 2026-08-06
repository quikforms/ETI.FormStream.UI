export class Notification {
    public id: number;

    constructor(
        public display: boolean,
        public cssPos: string,
        public cssType: string,
        public text: string,
        public displayHeadText: string,
        public timer: number,
        public hideAfterTimer: boolean = true,
        public type: string
    ) {}
};

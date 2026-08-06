export class FormsSummary {

      constructor(
        public id: number = 0,
        public name: string = '',
        public percent: number = 0,
        public missing: number = 0,
        public active: boolean = false) { }
}
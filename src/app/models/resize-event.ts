export interface ResizeEvent {
    host: any;
    handle: any;
    size: {
        width: number;
        height: number;
    };
    position: {
        top: number;
        left: number;
    };
}

declare namespace cc {
    interface Asset {
        resetTrace?: ()=>void;
        traceMap?: Map<string, number>;
    }
}
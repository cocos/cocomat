const { ccclass } = cc._decorator;

@ccclass
export class CCMVideoAssembler extends (cc as any).Assembler {

    // @ts-ignore
    private renderData: cc.RenderData = new cc.RenderData();
    private local: number[] = [];

    public constructor() {
        super();
        this.floatsPerVert = 5;
        this.verticesCount = 4;
        this.indicesCount = 6;
        this.uvOffset = 2;
        this.colorOffset = 4;
        this.uv = [0, 1, 1, 1, 0, 0, 1, 0];
        // @ts-ignore
        this.initData();
        this.initLocal();
    }

    private initData(): void {
        this.renderData.init(this);
        this.renderData.createQuadData(0, this.verticesCount * this.floatsPerVert, this.indicesCount);
    }

    private initLocal(): void {
        this.local.length = 4;
    }

    public updateColor(comp: cc.Component, color: number): void {
        let uintVerts = this.renderData.uintVDatas[0];
        if (!uintVerts) return;
        // @ts-ignore
        color = color || comp.node.color._val;
        let floatsPerVert = this.floatsPerVert;
        let colorOffset = this.colorOffset;
        for (let i = colorOffset, l = uintVerts.length; i < l; i += floatsPerVert) {
            uintVerts[i] = color;
        }
    }

    private getBuffer() {
        // @ts-ignore
        return cc.renderer._handle._meshBuffer;
    }

    private updateWorldVerts(comp: cc.Component): void {
        let local = this.local;
        let verts = this.renderData.vDatas[0];

        if (CC_JSB) {
            let vl = local[0],
                vr = local[2],
                vb = local[1],
                vt = local[3];
            // left bottom
            verts[0] = vl;
            verts[1] = vb;
            // right bottom
            verts[5] = vr;
            verts[6] = vb;
            // left top
            verts[10] = vl;
            verts[11] = vt;
            // right top
            verts[15] = vr;
            verts[16] = vt;
        } else {
            // @ts-ignore
            let matrix: cc.Mat4 = comp.node._worldMatrix;
            let matrixm = matrix.m,
                a = matrixm[0], b = matrixm[1], c = matrixm[4], d = matrixm[5],
                tx = matrixm[12], ty = matrixm[13];

            let vl = local[0], vr = local[2],
                vb = local[1], vt = local[3];

            let justTranslate = a === 1 && b === 0 && c === 0 && d === 1;

            if (justTranslate) {
                // left bottom
                verts[0] = vl + tx;
                verts[1] = vb + ty;
                // right bottom
                verts[5] = vr + tx;
                verts[6] = vb + ty;
                // left top
                verts[10] = vl + tx;
                verts[11] = vt + ty;
                // right top
                verts[15] = vr + tx;
                verts[16] = vt + ty;
            } else {
                let al = a * vl, ar = a * vr,
                    bl = b * vl, br = b * vr,
                    cb = c * vb, ct = c * vt,
                    db = d * vb, dt = d * vt;

                // left bottom
                verts[0] = al + cb + tx;
                verts[1] = bl + db + ty;
                // right bottom
                verts[5] = ar + cb + tx;
                verts[6] = br + db + ty;
                // left top
                verts[10] = al + ct + tx;
                verts[11] = bl + dt + ty;
                // right top
                verts[15] = ar + ct + tx;
                verts[16] = br + dt + ty;
            }
        }
    }

    public fillBuffers(comp: cc.Component, renderer: any): void {
        if (renderer.worldMatDirty) {
            this.updateWorldVerts(comp);
        }

        let renderData = this.renderData;
        let vData = renderData.vDatas[0];
        let iData = renderData.iDatas[0];

        let buffer = this.getBuffer();
        let offsetInfo = buffer.request(this.verticesCount, this.indicesCount);

        // buffer data may be realloc, need get reference after request.

        // fill vertices
        let vertexOffset = offsetInfo.byteOffset >> 2,
            vbuf = buffer._vData;

        if (vData.length + vertexOffset > vbuf.length) {
            vbuf.set(vData.subarray(0, vbuf.length - vertexOffset), vertexOffset);
        } else {
            vbuf.set(vData, vertexOffset);
        }

        // fill indices
        let ibuf = buffer._iData,
            indiceOffset = offsetInfo.indiceOffset,
            vertexId = offsetInfo.vertexOffset;
        for (let i = 0, l = iData.length; i < l; i++) {
            ibuf[indiceOffset++] = vertexId + iData[i];
        }

    }

    public updateRenderData(comp: cc.Component): void {
        // @ts-ignore
        if (comp._vertsDirty) {
            this.updateUVs(comp);
            this.updateVerts(comp);
            // @ts-ignore
            comp._vertsDirty = false;
        }
    }

    private updateUVs(comp: cc.Component): void {
        let uv = this.uv;
        let uvOffset = this.uvOffset;
        let floatsPerVert = this.floatsPerVert;
        let verts = this.renderData.vDatas[0];
        for (let i = 0; i < 4; i++) {
            let srcOffset = i * 2;
            let dstOffset = floatsPerVert * i + uvOffset;
            verts[dstOffset] = uv[srcOffset];
            verts[dstOffset + 1] = uv[srcOffset + 1];
        }
    }

    private updateVerts(comp: cc.Component) {
        let node = comp.node,
            cw = node.width, ch = node.height,
            appx = node.anchorX * cw, appy = node.anchorY * ch,
            l: number, b: number, r: number, t: number;
        l = -appx;
        b = -appy;
        r = cw - appx;
        t = ch - appy;

        let local = this.local;
        local[0] = l;
        local[1] = b;
        local[2] = r;
        local[3] = t;
        this.updateWorldVerts(comp);
    }

}

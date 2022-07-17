"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DistanceMatrix = void 0;
class DistanceMatrix {
    constructor() {
        this.distanceMatrix = [];
        this.getTransformList = () => [];
    }
    init(transformList = this.getTransformList(), graphics) {
        const distanceMatrix = [];
        transformList.forEach((transform) => {
            distanceMatrix[transform.entityId] = [];
        });
        transformList.forEach((transform1) => {
            transformList.forEach((transform2) => {
                this.updateDistanceBetween(transform1, transform2, distanceMatrix);
                graphics === null || graphics === void 0 ? void 0 : graphics.lineStyle(1, 0xAAAAAA, 0.7);
                graphics === null || graphics === void 0 ? void 0 : graphics.lineBetween(transform1.x, transform1.y, transform2.x, transform2.y);
            });
        });
        this.distanceMatrix = distanceMatrix;
    }
    insertTransform(transform, transformList = this.getTransformList()) {
        const distanceMatrix = this.distanceMatrix.map((row) => [...row]);
        transformList.forEach((transform2) => {
            this.updateDistanceBetween(transform, transform2, distanceMatrix);
        });
        this.distanceMatrix = distanceMatrix;
    }
    removeTransform(transform) {
        delete this.distanceMatrix[transform.entityId];
    }
    updateDistanceBetween(transform1, transform2, distanceMatrix) {
        const dx = transform1.x - transform2.x;
        const dy = transform1.y - transform2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (!distanceMatrix[transform1.entityId]) {
            distanceMatrix[transform1.entityId] = [];
        }
        distanceMatrix[transform1.entityId][transform2.entityId] = distance;
        distanceMatrix[transform2.entityId][transform1.entityId] = distance;
    }
    getDistanceBetween(transform1, transform2) {
        return this.distanceMatrix[transform1.entityId][transform2.entityId];
    }
}
exports.DistanceMatrix = DistanceMatrix;
//# sourceMappingURL=DistanceMatrix.js.map
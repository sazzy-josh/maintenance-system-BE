"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReference = void 0;
const generateReference = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
    return `REQ-${year}-${random}`;
};
exports.generateReference = generateReference;
//# sourceMappingURL=generateReference.js.map
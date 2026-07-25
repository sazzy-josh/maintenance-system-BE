"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestId = void 0;
const uuid_1 = require("uuid");
const requestId = (_req, res, next) => {
    const id = (0, uuid_1.v4)();
    res.setHeader('X-Request-Id', id);
    next();
};
exports.requestId = requestId;
//# sourceMappingURL=requestId.js.map
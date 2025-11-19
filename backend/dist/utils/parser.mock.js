"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockParseResume = mockParseResume;
function mockParseResume(buffer, filename) {
    const text = `Mock-parsed text for ${filename} - length ${buffer.length} bytes`;
    const summary = {
        name: "unknown",
        email: "unknown@example.com",
        skills: [],
        experienceYears: 0
    };
    return { text, summary };
}

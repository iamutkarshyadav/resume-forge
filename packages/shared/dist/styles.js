"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.styles = void 0;
const renderer_1 = require("@react-pdf/renderer");
// Register fonts (assuming they are available at runtime/build time)
// For now, we will use standard fonts to avoid complex font loading logic in the first pass
// In a real production setup, we would register custom fonts here.
// Font.register({
//   family: "Inter",
//   src: "..."
// });
exports.styles = renderer_1.StyleSheet.create({
    page: {
        padding: 30, // Default padding, can be overridden by ResumeDocument
        fontFamily: "Times-Roman", // Default fallback
        backgroundColor: "#ffffff",
    },
    header: {
        marginBottom: 10,
        textAlign: "center",
    },
    headerName: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 4,
        textTransform: "uppercase",
    },
    headerContact: {
        fontSize: 9,
        flexDirection: "row",
        justifyContent: "center",
        flexWrap: "wrap",
        marginBottom: 4,
        color: "#333",
    },
    contactItem: {
        marginHorizontal: 4,
    },
    section: {
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: "bold",
        borderBottomWidth: 1,
        borderBottomColor: "#000",
        borderBottomStyle: "solid",
        paddingBottom: 2,
        marginBottom: 6,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    entry: {
        marginBottom: 6,
    },
    entryHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 2,
    },
    entryTitle: {
        fontSize: 10.5,
        fontWeight: "bold",
    },
    entryDate: {
        fontSize: 9,
        textAlign: "right",
    },
    entrySubHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 2,
    },
    entryCompany: {
        fontSize: 10,
        fontStyle: "italic",
        color: "#444",
    },
    entryLocation: {
        fontSize: 9,
        fontStyle: "italic",
        color: "#444",
    },
    bulletList: {
        marginLeft: 15,
    },
    bulletItem: {
        fontSize: 10,
        marginBottom: 2,
        flexDirection: "row",
    },
    bulletPoint: {
        width: 10,
        fontSize: 10,
    },
    bulletContent: {
        flex: 1,
        fontSize: 10,
    },
    skillCategory: {
        flexDirection: "row",
        marginBottom: 2,
    },
    skillCategoryName: {
        fontWeight: "bold",
        fontSize: 10,
        width: 100,
    },
    skillList: {
        fontSize: 10,
        flex: 1,
    }
});

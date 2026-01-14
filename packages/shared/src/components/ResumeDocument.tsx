import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Link,
} from "@react-pdf/renderer";
import { ResolvedLayout } from "../layout-resolver";
import { styles } from "../styles";

interface ResumeDocumentProps {
  layout: ResolvedLayout;
}

export const ResumeDocument: React.FC<ResumeDocumentProps> = ({ layout }) => {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerName}>{String(layout.header.name || "")}</Text>
          <View style={styles.headerContact}>
            {layout.header.location ? <Text style={styles.contactItem}>{String(layout.header.location)}</Text> : null}
            {layout.header.email ? <Text style={styles.contactItem}>• {String(layout.header.email)}</Text> : null}
            {layout.header.phone ? <Text style={styles.contactItem}>• {String(layout.header.phone)}</Text> : null}
            {layout.header.links && layout.header.links.length > 0 ?
              layout.header.links.map((link, i) => (
                <Text key={i} style={styles.contactItem}>
                  • <Link src={link.url || ""}>{String(link.label || link.type || "Link")}</Link>
                </Text>
              )) : null}
          </View>
        </View>

        {/* Sections */}
        {layout.sections.map((section, idx) => (
          <View key={section.id || idx} style={styles.section}>
            <Text style={styles.sectionTitle}>{String(section.title || "")}</Text>
            
            {section.id === "skills" ? (
               // Skills special layout
               <View>
                 {section.entries.map((entry, eIdx) => (
                   <View key={eIdx} style={styles.skillCategory}>
                     {entry.title ? (
                       <Text style={styles.skillCategoryName}>{String(entry.title)}:</Text>
                     ) : null}
                     {entry.bullets && entry.bullets.length > 0 ? (
                          <Text style={styles.skillList}>
                              {Array.isArray(entry.bullets) ? entry.bullets.join(", ") : ""}
                          </Text>
                     ) : null}
                   </View>
                 ))}
               </View>
            ) : (
                // Standard Layout (Experience, Projects, Education)
                section.entries.map((entry, eIdx) => (
                    <View key={eIdx} style={styles.entry}>
                      {/* First Line: Title & Date */}
                      <View style={styles.entryHeader}>
                        <Text style={styles.entryTitle}>
                            {String(entry.title || entry.role || entry.company || "")}
                        </Text>
                        {entry.date ? (
                            <Text style={styles.entryDate}>{String(entry.date)}</Text>
                        ) : null}
                      </View>
    
                      {/* Second Line: Subheader (Company/Location) */}
                      {(entry.company || entry.location) ? (
                          <View style={styles.entrySubHeader}>
                            <Text style={styles.entryCompany}>
                                {String(entry.company || "")}
                                {(entry.company && (entry as any).role && entry.title) ? ` - ${String((entry as any).role)}` : ""}
                            </Text>
                            {entry.location ? (
                                <Text style={styles.entryLocation}>{String(entry.location)}</Text>
                            ) : null}
                          </View>
                      ) : null}
                      
                      {/* Description */}
                      {entry.description ? (
                         <Text style={{ fontSize: 10, marginBottom: 2 }}>
                           {String(entry.description)}
                         </Text>
                      ) : null}
    
                      {/* Bullets */}
                      {entry.bullets && entry.bullets.length > 0 ? (
                        <View style={styles.bulletList}>
                          {entry.bullets.map((bullet, bIdx) => (
                            <View key={bIdx} style={styles.bulletItem}>
                              <Text style={styles.bulletPoint}>•</Text>
                              <Text style={styles.bulletContent}>{String(bullet || "")}</Text>
                            </View>
                          ))}
                        </View>
                      ) : null}
                    </View>
                  ))
            )}
            
          </View>
        ))}
      </Page>
    </Document>
  );
};

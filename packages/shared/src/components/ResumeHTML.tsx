import React from "react";
import { ResolvedLayout } from "../layout-resolver";

interface ResumeHTMLProps {
  layout: ResolvedLayout;
}

export const ResumeHTML: React.FC<ResumeHTMLProps> = ({ layout }) => {
  return (
    <div className="resume-container">
      {/* Header */}
      <header className="resume-header">
        <h1 className="resume-name">{layout.header.name}</h1>
        <div className="resume-contact">
          {layout.header.location && <span>{layout.header.location}</span>}
          {layout.header.email && (
            <>
              {layout.header.location && <span className="separator">•</span>}
              <span>{layout.header.email}</span>
            </>
          )}
          {layout.header.phone && (
            <>
              {(layout.header.location || layout.header.email) && <span className="separator">•</span>}
              <span>{layout.header.phone}</span>
            </>
          )}
          {layout.header.links && layout.header.links.length > 0 && (
            <>
              {layout.header.links.map((link, i) => (
                <React.Fragment key={i}>
                  <span className="separator">•</span>
                  <a href={link.url} className="resume-link">
                    {link.label || link.type}
                  </a>
                </React.Fragment>
              ))}
            </>
          )}
        </div>
      </header>

      {/* Sections */}
      {layout.sections.map((section, idx) => (
        <section key={section.id || idx} className="resume-section">
          <h2 className="section-title">{section.title}</h2>
          
          <div className="section-content">
            {section.id === "skills" ? (
              <div className="skills-grid">
                {section.entries.map((entry, eIdx) => (
                  <div key={eIdx} className="skills-category">
                    {entry.title && (
                      <span className="category-name">{entry.title}: </span>
                    )}
                    <span className="skills-list">
                      {Array.isArray(entry.bullets) ? entry.bullets.join(", ") : ""}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              section.entries.map((entry, eIdx) => (
                <div key={eIdx} className="resume-entry">
                  <div className="entry-header">
                    <span className="entry-title">
                      {entry.title || entry.role || entry.company || ""}
                    </span>
                    {entry.date && <span className="entry-date">{entry.date}</span>}
                  </div>

                  {(entry.company || entry.location) && (
                    <div className="entry-subheader">
                      <span className="entry-company">
                        {entry.company || ""}
                        {(entry.company && (entry as any).role && entry.title) ? ` - ${(entry as any).role}` : ""}
                      </span>
                      {entry.location && (
                        <span className="entry-location">{entry.location}</span>
                      )}
                    </div>
                  )}

                  {entry.description && (
                    <div className="entry-description">{entry.description}</div>
                  )}

                  {entry.bullets && entry.bullets.length > 0 && (
                    <ul className="resume-bullets">
                      {entry.bullets.map((bullet, bIdx) => (
                        <li key={bIdx} className="bullet-item">
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      ))}
    </div>
  );
};

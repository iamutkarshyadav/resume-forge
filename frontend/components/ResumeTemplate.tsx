import React from "react";

export interface ResumeData {
  name: string;
  email: string;
  phone: string;
  location?: string;
  title?: string;
  summary: string;
  links?: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  skills: string[] | { category: string; items: string[] }[];
  experience: Array<{
    company?: string;
    role?: string;
    title?: string;
    startDate?: string;
    start?: string;
    endDate?: string;
    end?: string;
    location?: string;
    description?: string;
    bullets?: string[];
  }>;
  projects: Array<{
    name?: string;
    description?: string;
    tech?: string[];
    bullets?: string[];
  }>;
  education: Array<{
    institution?: string;
    degree?: string;
    field?: string;
    startYear?: string;
    start?: string;
    endYear?: string;
    end?: string;
    gpa?: string;
  }>;
}

interface ResumeTemplateProps {
  data: ResumeData;
  templateName?: string;
}

export const ResumeTemplate = React.forwardRef<
  HTMLDivElement,
  ResumeTemplateProps
>(({ data }, ref) => {
  // Normalize dates
  const normalizeDate = (start?: string, end?: string) => {
    const s = (start || "").trim();
    const e = (end || "").trim();
    if (!s && !e) return "";
    if (s && e) return `${s} – ${e}`;
    if (s) return s;
    return e;
  };

  // Get location info
  const location = data.location || "";

  // Process skills
  const skillsData = Array.isArray(data.skills)
    ? data.skills[0] && typeof data.skills[0] === "object" && "category" in data.skills[0]
      ? (data.skills as { category: string; items: string[] }[])
      : [{ category: "Skills", items: data.skills as string[] }]
    : [];

  // Filter out empty entries
  const hasExperience = data.experience && data.experience.length > 0 && data.experience.some(e => e.company || e.role || e.title);
  const hasProjects = data.projects && data.projects.length > 0 && data.projects.some(p => p.name);
  const hasEducation = data.education && data.education.length > 0 && data.education.some(e => e.institution || e.degree);

  return (
    <div
      ref={ref}
      className="resume-container bg-white text-black"
      style={{
        fontFamily: "Calibri, Arial, sans-serif",
        fontSize: "10.5pt",
        lineHeight: "1.4",
        color: "#000",
      }}
    >
      {/* Main Container - 8.5in x 11in with margins */}
      <div
        style={{
          width: "8.5in",
          height: "11in",
          margin: "0 auto",
          padding: "0.5in 0.5in",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* HEADER SECTION */}
        <div style={{ marginBottom: "8pt" }}>
          {/* Name */}
          <div
            style={{
              fontSize: "18pt",
              fontWeight: "bold",
              marginBottom: "2pt",
              letterSpacing: "0.5pt",
            }}
          >
            {data.name}
          </div>

          {/* Contact Information */}
          <div
            style={{
              fontSize: "9pt",
              color: "#333",
              marginBottom: "4pt",
              display: "flex",
              flexWrap: "wrap",
              gap: "8pt",
            }}
          >
            {data.email && <span>{data.email}</span>}
            {data.phone && <span>•</span>}
            {data.phone && <span>{data.phone}</span>}
            {location && <span>•</span>}
            {location && <span>{location}</span>}
            {data.links?.linkedin && <span>•</span>}
            {data.links?.linkedin && <span>{data.links.linkedin.replace(/^https:\/\/(www\.)?linkedin\.com\/in\//, "")}</span>}
            {data.links?.github && <span>•</span>}
            {data.links?.github && <span>{data.links.github.replace(/^https:\/\/(www\.)?github\.com\//, "")}</span>}
          </div>

          {/* Professional Title (if available) */}
          {data.title && (
            <div
              style={{
                fontSize: "10pt",
                color: "#555",
                fontStyle: "italic",
                marginTop: "2pt",
              }}
            >
              {data.title}
            </div>
          )}
        </div>

        {/* DIVIDER */}
        <div
          style={{
            height: "1pt",
            backgroundColor: "#000",
            marginBottom: "6pt",
          }}
        />

        {/* SUMMARY SECTION */}
        {data.summary && (
          <div style={{ marginBottom: "8pt" }}>
            <div
              style={{
                fontSize: "10.5pt",
                fontWeight: "bold",
                marginBottom: "3pt",
                textTransform: "uppercase",
                letterSpacing: "1pt",
              }}
            >
              Professional Summary
            </div>
            <div
              style={{
                fontSize: "10pt",
                lineHeight: "1.5",
                color: "#1a1a1a",
              }}
            >
              {data.summary}
            </div>
          </div>
        )}

        {/* EXPERIENCE SECTION */}
        {hasExperience && (
          <div style={{ marginBottom: "8pt" }}>
            <div
              style={{
                fontSize: "10.5pt",
                fontWeight: "bold",
                marginBottom: "3pt",
                textTransform: "uppercase",
                letterSpacing: "1pt",
              }}
            >
              Professional Experience
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6pt" }}>
              {data.experience
                .filter(exp => exp.company || exp.role || exp.title)
                .map((exp, idx) => (
                  <div key={idx}>
                    {/* Company and Role Header */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "1pt",
                      }}
                    >
                      <div style={{ fontWeight: "bold", fontSize: "10pt" }}>
                        {exp.role || exp.title || "Position"}
                      </div>
                      <div style={{ fontSize: "9pt", color: "#333" }}>
                        {normalizeDate(exp.startDate || exp.start, exp.endDate || exp.end)}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "3pt",
                        fontSize: "10pt",
                      }}
                    >
                      <div style={{ color: "#555" }}>{exp.company}</div>
                      {exp.location && <div style={{ color: "#555" }}>{exp.location}</div>}
                    </div>

                    {/* Bullets */}
                    {exp.bullets && exp.bullets.length > 0 && (
                      <ul
                        style={{
                          margin: "2pt 0",
                          paddingLeft: "18pt",
                          fontSize: "10pt",
                          lineHeight: "1.5",
                        }}
                      >
                        {exp.bullets.map((bullet, bidx) => (
                          <li key={bidx} style={{ marginBottom: "2pt" }}>
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    )}
                    {exp.description && !exp.bullets && (
                      <div
                        style={{
                          fontSize: "10pt",
                          lineHeight: "1.5",
                          color: "#1a1a1a",
                          marginLeft: "12pt",
                        }}
                      >
                        {exp.description}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* SKILLS SECTION */}
        {skillsData.length > 0 && skillsData.some(s => s.items && s.items.length > 0) && (
          <div style={{ marginBottom: "8pt" }}>
            <div
              style={{
                fontSize: "10.5pt",
                fontWeight: "bold",
                marginBottom: "3pt",
                textTransform: "uppercase",
                letterSpacing: "1pt",
              }}
            >
              Skills
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4pt" }}>
              {skillsData
                .filter(s => s.items && s.items.length > 0)
                .map((skillGroup, idx) => (
                  <div key={idx}>
                    <span style={{ fontWeight: "bold", fontSize: "10pt" }}>
                      {skillGroup.category}:
                    </span>
                    <span style={{ fontSize: "10pt", marginLeft: "4pt" }}>
                      {skillGroup.items.join(", ")}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* PROJECTS SECTION */}
        {hasProjects && (
          <div style={{ marginBottom: "8pt" }}>
            <div
              style={{
                fontSize: "10.5pt",
                fontWeight: "bold",
                marginBottom: "3pt",
                textTransform: "uppercase",
                letterSpacing: "1pt",
              }}
            >
              Projects
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6pt" }}>
              {data.projects
                .filter(proj => proj.name)
                .map((proj, idx) => (
                  <div key={idx}>
                    {/* Project Title and Tech */}
                    <div
                      style={{
                        fontWeight: "bold",
                        fontSize: "10pt",
                        marginBottom: "1pt",
                      }}
                    >
                      {proj.name}
                      {proj.tech && proj.tech.length > 0 && (
                        <span style={{ fontWeight: "normal", color: "#555", marginLeft: "4pt" }}>
                          • {proj.tech.join(", ")}
                        </span>
                      )}
                    </div>

                    {/* Project Bullets */}
                    {proj.bullets && proj.bullets.length > 0 && (
                      <ul
                        style={{
                          margin: "2pt 0",
                          paddingLeft: "18pt",
                          fontSize: "10pt",
                          lineHeight: "1.5",
                        }}
                      >
                        {proj.bullets.map((bullet, bidx) => (
                          <li key={bidx} style={{ marginBottom: "2pt" }}>
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    )}
                    {proj.description && !proj.bullets && (
                      <div
                        style={{
                          fontSize: "10pt",
                          lineHeight: "1.5",
                          color: "#1a1a1a",
                          marginLeft: "12pt",
                        }}
                      >
                        {proj.description}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* EDUCATION SECTION */}
        {hasEducation && (
          <div style={{ marginBottom: "8pt" }}>
            <div
              style={{
                fontSize: "10.5pt",
                fontWeight: "bold",
                marginBottom: "3pt",
                textTransform: "uppercase",
                letterSpacing: "1pt",
              }}
            >
              Education
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4pt" }}>
              {data.education
                .filter(edu => edu.institution || edu.degree)
                .map((edu, idx) => (
                  <div key={idx}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "1pt",
                      }}
                    >
                      <div style={{ fontWeight: "bold", fontSize: "10pt" }}>
                        {edu.degree}
                        {edu.field && ` in ${edu.field}`}
                      </div>
                      <div style={{ fontSize: "9pt", color: "#333" }}>
                        {normalizeDate(edu.startYear || edu.start, edu.endYear || edu.end)}
                      </div>
                    </div>
                    <div style={{ fontSize: "10pt", color: "#555" }}>
                      {edu.institution}
                    </div>
                    {edu.gpa && (
                      <div style={{ fontSize: "9pt", color: "#666", marginTop: "1pt" }}>
                        GPA: {edu.gpa}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .resume-container {
            margin: 0;
            padding: 0;
            page-break-after: always;
          }
          * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            color-adjust: exact;
          }
        }
        @page {
          margin: 0;
          size: 8.5in 11in;
        }
      `}</style>
    </div>
  );
});

ResumeTemplate.displayName = "ResumeTemplate";

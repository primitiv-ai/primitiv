---
type: security-principles
version: 1
policies:
  authentication:
    - Multi-factor authentication (MFA) required for all access
    - Hardware security keys where applicable
    - Secure identity providers only
    - Continuous authentication under Zero Trust model
    - Device and identity verification on every access request
    - Role-based or attribute-based access control (RBAC/ABAC)
    - Access permissions must be auditable and revocable at any time
    - Time-limited access rights when possible
  dataHandling:
    - Data classified into public, internal, confidential, restricted tiers
    - Security controls scaled to data sensitivity level
    - Encryption required in transit and at rest using approved protocols
    - No outdated or insecure cryptographic standards permitted
    - Data minimization — collect and store only what is strictly necessary
    - Retention policies must be defined and enforced
    - Credentials never stored in plaintext, embedded in repos, or exposed in logs
    - Secrets managed through secure secret management systems
  dependencies:
    - All external libraries and dependencies monitored for vulnerabilities
    - Automated tools must track known security risks in dependencies
    - Outdated or vulnerable dependencies must be upgraded promptly
    - Dependency vulnerability analysis integrated into CI/CD pipelines
  networking:
    - Zero Trust Architecture — no component inherently trusted
    - Strict network segmentation enforced
    - Firewalls with restricted ingress and egress rules
    - Unauthorized network exposure must be prevented
    - Cloud deployments must use identity isolation, network security groups, and encryption services
    - System hardening — unnecessary services disabled, OS and infrastructure software kept updated
    - Monitored access patterns for anomaly detection
owaspAlignment:
  - "A01:2021 Broken Access Control — Enforced via least privilege, RBAC/ABAC, continuous authorization verification"
  - "A02:2021 Cryptographic Failures — Encryption in transit and at rest, approved protocols only, no plaintext credentials"
  - "A03:2021 Injection — Secure coding standards mandate prevention of all injection attacks"
  - "A04:2021 Insecure Design — Security by Design principle, security integrated from idea through deployment"
  - "A05:2021 Security Misconfiguration — System hardening, configuration validation, unnecessary services disabled"
  - "A06:2021 Vulnerable Components — Automated dependency monitoring, prompt upgrade of vulnerable dependencies"
  - "A07:2021 Authentication Failures — MFA required, hardware keys, secure identity providers"
  - "A08:2021 Software and Data Integrity — Code review mandatory, AI-generated code verified before deployment"
  - "A09:2021 Security Logging and Monitoring — Tamper-protected logs, anomaly detection, full traceability"
  - "A10:2021 Server-Side Request Forgery — Network segmentation, restricted egress, Zero Trust verification"
updatedAt: "2026-03-14T22:12:00Z"
---

# Security Principles — Primitive

*Aligned with ISO/IEC 27001 and OWASP Top 10*

## 1. Security Philosophy

Primitive security is built on five foundational principles that govern every system, agent, and process within the platform.

### Security by Design
Security requirements must be integrated from the earliest stage of development. Every system must incorporate security considerations across the full pipeline — from idea through prespec, specification, architecture, implementation, testing, and deployment. Security must never be retrofitted after implementation.

### Least Privilege
All users, services, and AI agents must only be granted the minimum permissions required to perform their tasks. Access rights must be explicitly defined, time-limited when possible, and continuously reviewed. No blanket permissions are acceptable.

### Defense in Depth
Systems must implement multiple layers of security controls. No single protection mechanism is sufficient. Controls must exist at the identity, application, infrastructure, network, and data levels simultaneously.

### Zero Trust Architecture
No component is inherently trusted. All access requests must be authenticated, authorized, and verified — regardless of origin. This includes continuous authentication, device and identity verification, strict network segmentation, and monitored access patterns.

### Continuous Verification
Security must be continuously validated through automated mechanisms for vulnerability detection, configuration validation, dependency monitoring, and anomaly detection. Security is a continuous process, not a static configuration.

## 2. Identity and Access Management

### Authentication
All access to Primitive systems requires strong authentication. Approved mechanisms include multi-factor authentication (MFA), hardware security keys, and secure identity providers. Single-factor authentication is not permitted for any production system.

### Authorization
Authorization is enforced through role-based or attribute-based access control. Permissions must be clearly defined, auditable, and revocable at any time. Access grants must follow the principle of least privilege without exception.

### Credential Security
Credentials must never be stored in plaintext, embedded in code repositories, or exposed in logs or error messages. All secrets must be stored using dedicated secure secret management systems. Hardcoded credentials in any form are a compliance violation.

## 3. Data Security

### Data Classification
All data must be classified into defined categories: public, internal, confidential, or restricted. Security controls must be adapted to the sensitivity level. Systems handling restricted data must implement the strongest available protections.

### Encryption
All sensitive data must be encrypted in transit and at rest using approved, modern cryptographic protocols. Outdated or insecure cryptographic standards (e.g., MD5, SHA-1 for hashing, DES, RC4) are prohibited. TLS 1.2 is the minimum for data in transit.

### Data Minimization
Systems must only collect and store data that is strictly necessary for their function. Unnecessary data retention must be avoided. Retention policies must be defined and enforced, with automated cleanup where possible.

## 4. Secure Development

### Secure Coding Standards
All code — whether produced by human developers or AI agents — must follow secure coding standards. Common vulnerabilities must be actively prevented, including injection attacks, insecure authentication flows, improper error handling, and unsafe dependency usage.

### Dependency Management
All external libraries and dependencies must be continuously monitored for known vulnerabilities. Automated tooling must track security risks across the dependency tree. Outdated or vulnerable dependencies must be upgraded promptly. No known-vulnerable dependency may ship to production.

### Code Review
All code must undergo review before integration into production systems. Primitive's Review Engine must analyze code for security vulnerabilities, architecture violations, and unsafe patterns. AI-generated code receives the same scrutiny as human-written code.

## 5. Infrastructure Security

### Network Security
Infrastructure must enforce firewalls, network segmentation, and restricted ingress/egress rules. No unauthorized network exposure is permitted. All services must be explicitly exposed — default-deny is the baseline.

### System Hardening
All servers and infrastructure components must be hardened. Unnecessary services and ports must be disabled. Operating systems and infrastructure software must remain updated with security patches applied promptly.

### Cloud Security
Cloud deployments must follow provider security best practices including identity isolation, network security groups, encryption services, and proper IAM configuration. Shared-responsibility boundaries must be clearly understood and documented.

## 6. Monitoring, Logging & Incident Response

### Monitoring and Logging
All systems must generate logs sufficient for traceability and security analysis. Logs must capture authentication attempts, privilege escalations, system modifications, and deployment events. Logs must be protected against tampering. Monitoring systems must detect and alert on suspicious activity.

### Incident Management
Security incidents follow a defined lifecycle: Detection, Investigation, Containment, Remediation, Recovery, and Post-incident review. Every incident report must document root causes, mitigation measures, and prevention strategies. Incident response must be rehearsed and kept current.

## 7. Security Testing

Security testing is mandatory and must be integrated into CI/CD pipelines. Required testing includes automated vulnerability scanning, dependency vulnerability analysis, and penetration testing where applicable. No release may proceed with known critical or high-severity vulnerabilities unaddressed.

## 8. AI Security

AI agents interacting with Primitive systems must operate within defined permission scopes. Agents must never access secrets without explicit authorization. All AI-generated outputs must be auditable. AI-generated code must be verified through the same review pipeline as human-written code before deployment.

## 9. Compliance and Auditing

Security practices must remain aligned with ISO/IEC 27001 and modern secure software development frameworks. All security controls must be auditable. Audit logs and documentation must support external review when required. The Information Security Management System (ISMS) must be maintained and regularly reviewed.

## 10. Shared Responsibility

Security is a shared responsibility across the entire Primitive ecosystem — developers implementing secure systems, operators maintaining infrastructure integrity, and governance mechanisms enforcing policies. Every contributor must treat security as a fundamental obligation, not an optional concern.

## 11. Absolute Constraint

Primitive systems must never sacrifice security for speed. Any system that violates these security principles is considered non-compliant and unsafe for deployment. There are no exceptions — accelerated development must always maintain strong guarantees of reliability and protection.

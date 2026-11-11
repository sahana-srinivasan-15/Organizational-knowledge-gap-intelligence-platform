package com.orgkgi.service;

import com.orgkgi.dto.admin.*;
import com.orgkgi.entity.EmployeeProfile;
import com.orgkgi.entity.Role;
import com.orgkgi.entity.User;
import com.orgkgi.exception.ResourceNotFoundException;
import com.orgkgi.repository.EmployeeProfileRepository;
import com.orgkgi.repository.UserRepository;
import com.orgkgi.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AdminPerformanceService {

    private final UserRepository userRepository;
    private final EmployeeProfileRepository employeeProfileRepository;
    private final NotificationService notificationService;

    // Runtime state tracking for dynamic admin escalations, justifications, and granted rewards
    private final Map<Long, String> escalationStatusMap = new ConcurrentHashMap<>();
    private final Map<Long, String> inquiryReasonMap = new ConcurrentHashMap<>();
    private final Map<Long, String> managerExplanationMap = new ConcurrentHashMap<>();
    private final Map<Long, Integer> extensionDaysMap = new ConcurrentHashMap<>();
    private final Map<Long, List<String>> awardedBadgesMap = new ConcurrentHashMap<>();
    private final Map<Long, List<String>> appreciationMessagesMap = new ConcurrentHashMap<>();

    public AdminPerformanceService(
            UserRepository userRepository,
            EmployeeProfileRepository employeeProfileRepository,
            NotificationService notificationService) {
        this.userRepository = userRepository;
        this.employeeProfileRepository = employeeProfileRepository;
        this.notificationService = notificationService;

        // Seed initial known state for low performer escalation demonstration
        initDefaultLowPerformerState();
    }

    private void initDefaultLowPerformerState() {
        // Find Priya Raman if present in database or initialize by email lookup later
    }

    @Transactional(readOnly = true)
    public List<EmployeePerformanceDto> getPerformanceOverview() {
        List<User> allUsers = userRepository.findAll();
        List<EmployeePerformanceDto> result = new ArrayList<>();

        for (User u : allUsers) {
            // Exclude pure admin user from employee performance roster
            if (u.getRole() == Role.ADMIN) {
                continue;
            }

            EmployeePerformanceDto dto = new EmployeePerformanceDto();
            dto.setUserId(u.getId());
            dto.setFullName(u.getFullName());
            dto.setEmail(u.getEmail());
            dto.setRole(u.getRole().name());
            dto.setDepartmentName(u.getDepartment() != null ? u.getDepartment().getName() : "Core Engineering");

            EmployeeProfile profile = employeeProfileRepository.findByUserId(u.getId()).orElse(null);
            if (profile != null) {
                dto.setEmployeeProfileId(profile.getId());
                dto.setCurrentJobRoleTitle(profile.getCurrentJobRole() != null ? profile.getCurrentJobRole().getTitle() : "Software Engineer");
                dto.setTargetJobRoleTitle(profile.getTargetJobRole() != null ? profile.getTargetJobRole().getTitle() : "Senior Engineer");
                if (profile.getManager() != null) {
                    dto.setManagerId(profile.getManager().getId());
                    dto.setManagerFullName(profile.getManager().getFullName());
                    dto.setManagerEmail(profile.getManager().getEmail());
                } else {
                    dto.setManagerFullName("Sarah Jenkins");
                    dto.setManagerEmail("manager.eng@orgkgi.dev");
                }
            } else {
                dto.setCurrentJobRoleTitle(u.getRole() == Role.MANAGER ? "Engineering Manager" : "Technical Lead / Mentor");
                dto.setTargetJobRoleTitle(u.getRole() == Role.MANAGER ? "Director of Engineering" : "Principal Fellow");
                dto.setManagerFullName(u.getRole() == Role.MANAGER ? "Executive Leadership" : "Sarah Jenkins");
                dto.setManagerEmail("admin@orgkgi.dev");
            }

            // Populate persona-specific performance, readiness, and verified competency details
            populatePerformanceMetrics(u, dto);

            // Apply runtime escalation status & rewards
            if (escalationStatusMap.containsKey(u.getId())) {
                dto.setEscalationStatus(escalationStatusMap.get(u.getId()));
            }
            if (inquiryReasonMap.containsKey(u.getId())) {
                dto.setInquiryReason(inquiryReasonMap.get(u.getId()));
            }
            if (managerExplanationMap.containsKey(u.getId())) {
                dto.setManagerExplanation(managerExplanationMap.get(u.getId()));
            }
            if (extensionDaysMap.containsKey(u.getId())) {
                dto.setExtensionDays(extensionDaysMap.get(u.getId()));
            }
            if (awardedBadgesMap.containsKey(u.getId())) {
                dto.getAwardedBadges().addAll(awardedBadgesMap.get(u.getId()));
            }
            if (appreciationMessagesMap.containsKey(u.getId())) {
                dto.getAppreciationMessages().addAll(appreciationMessagesMap.get(u.getId()));
            }

            result.add(dto);
        }

        return result;
    }

    private void populatePerformanceMetrics(User u, EmployeePerformanceDto dto) {
        String email = u.getEmail().toLowerCase();

        if (email.contains("david")) {
            // David Kim - Top Performer Employee
            dto.setDiagnosticTestScore(85.0);
            dto.setReadinessScorePercentage(85.0);
            dto.setPerformanceTier("TOP_PERFORMER");
            dto.setVerifiedSkillsCount(4);
            dto.setGapSkillsCount(2);
            dto.setVerifiedSkillNames(List.of(
                    "Java Programming (L3)",
                    "Spring Boot Framework (L3)",
                    "PostgreSQL Optimization (L3)",
                    "Docker & Containers (L2)"
            ));
            dto.setCriticalGaps(List.of("System Design & Architecture", "Distributed Caching with Redis"));
        } else if (email.contains("alex.senior") || email.contains("principal")) {
            // Alex Morgan Principal Engineer - Top Performer Employee
            dto.setDiagnosticTestScore(95.0);
            dto.setReadinessScorePercentage(95.0);
            dto.setPerformanceTier("TOP_PERFORMER");
            dto.setVerifiedSkillsCount(6);
            dto.setGapSkillsCount(0);
            dto.setVerifiedSkillNames(List.of(
                    "Distributed Systems (L4)",
                    "Cloud Architecture (L4)",
                    "Kubernetes Orchestration (L4)",
                    "High-Throughput Microservices (L4)"
            ));
            dto.setCriticalGaps(List.of());
        } else if (email.contains("elena")) {
            // Elena Rostova - Top Performer AI Engineer
            dto.setDiagnosticTestScore(92.0);
            dto.setReadinessScorePercentage(92.0);
            dto.setPerformanceTier("TOP_PERFORMER");
            dto.setVerifiedSkillsCount(5);
            dto.setGapSkillsCount(1);
            dto.setVerifiedSkillNames(List.of(
                    "Deep Learning & PyTorch (L4)",
                    "LLM Fine-Tuning (L3)",
                    "Vector Databases (L3)",
                    "Python Systems (L4)"
            ));
            dto.setCriticalGaps(List.of("MLOps Deployment Pipelines"));
        } else if (email.contains("marcus")) {
            // Marcus Vance - Top Performer Cloud Engineer
            dto.setDiagnosticTestScore(88.0);
            dto.setReadinessScorePercentage(88.0);
            dto.setPerformanceTier("TOP_PERFORMER");
            dto.setVerifiedSkillsCount(4);
            dto.setGapSkillsCount(1);
            dto.setVerifiedSkillNames(List.of(
                    "Terraform & IaC (L4)",
                    "AWS Infrastructure (L3)",
                    "CI/CD Automation (L3)",
                    "Golang (L3)"
            ));
            dto.setCriticalGaps(List.of("Edge Compute Networking"));
        } else if (email.contains("maya")) {
            // Maya Patel - Solid Proficient Frontend Engineer
            dto.setDiagnosticTestScore(78.0);
            dto.setReadinessScorePercentage(78.0);
            dto.setPerformanceTier("PROFICIENT");
            dto.setVerifiedSkillsCount(3);
            dto.setGapSkillsCount(2);
            dto.setVerifiedSkillNames(List.of(
                    "React 18 & TypeScript (L3)",
                    "Design Systems (L3)",
                    "Micro-Frontends (L2)"
            ));
            dto.setCriticalGaps(List.of("WebAssembly", "Performance Profiling"));
        } else if (email.contains("priya.raman")) {
            // Priya Raman - Low Performer / Unassessed Employee
            dto.setDiagnosticTestScore(35.0);
            dto.setReadinessScorePercentage(32.0);
            dto.setPerformanceTier("AT_RISK");
            dto.setVerifiedSkillsCount(1);
            dto.setGapSkillsCount(4);
            dto.setVerifiedSkillNames(List.of("Manual QA Basics (L1)"));
            dto.setCriticalGaps(List.of(
                    "Automated Test Frameworks",
                    "CI/CD Integration",
                    "API Load Testing",
                    "Performance Diagnostics"
            ));

            // Default escalation state if not already modified
            if (!escalationStatusMap.containsKey(u.getId())) {
                dto.setEscalationStatus("REASON_RECEIVED");
                dto.setInquiryReason("Missed mandatory diagnostic test cycle and low target readiness (32%)");
                dto.setManagerExplanation("Employee was on approved emergency medical leave during the assessment cycle with HR documentation.");
            }
        } else if (u.getRole() == Role.MANAGER) {
            // Sarah Jenkins - Engineering Manager Top Performer
            dto.setDiagnosticTestScore(96.0);
            dto.setReadinessScorePercentage(94.2);
            dto.setPerformanceTier("TOP_PERFORMER");
            dto.setVerifiedSkillsCount(5);
            dto.setGapSkillsCount(0);
            dto.setVerifiedSkillNames(List.of(
                    "Engineering Leadership (L4)",
                    "Team Gap Closure (84.6%)",
                    "Technical Roadmapping (L4)",
                    "Mentorship Guidance (L4)"
            ));
            dto.setCriticalGaps(List.of());
        } else if (u.getRole() == Role.MENTOR) {
            // Mentors - Top Performers
            dto.setDiagnosticTestScore(95.0);
            dto.setReadinessScorePercentage(94.0);
            dto.setPerformanceTier("TOP_PERFORMER");
            dto.setVerifiedSkillsCount(4);
            dto.setGapSkillsCount(0);
            dto.setVerifiedSkillNames(List.of(
                    "Peer Mentorship & Coaching (L4)",
                    "Technical Architecture (L4)",
                    "Engineering Best Practices (L4)"
            ));
            dto.setCriticalGaps(List.of());
        } else {
            dto.setDiagnosticTestScore(70.0);
            dto.setReadinessScorePercentage(72.0);
            dto.setPerformanceTier("PROFICIENT");
            dto.setVerifiedSkillsCount(2);
            dto.setGapSkillsCount(2);
            dto.setVerifiedSkillNames(List.of("Core Engineering (L2)"));
            dto.setCriticalGaps(List.of("Specialized Domain Skills"));
        }
    }

    @Transactional
    public EmployeePerformanceDto inquireManager(InquireManagerRequest req) {
        User employee = userRepository.findById(req.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", req.getUserId()));

        Long currentAdminId = SecurityUtils.getCurrentUserId();
        User adminUser = currentAdminId != null ? userRepository.findById(currentAdminId).orElse(null) : null;

        // Find assigned manager (or Sarah Jenkins)
        EmployeeProfile profile = employeeProfileRepository.findByUserId(employee.getId()).orElse(null);
        User manager = profile != null ? profile.getManager() : null;
        if (manager == null) {
            manager = userRepository.findByEmail("manager.eng@orgkgi.dev").orElse(null);
        }

        // Dispatch official notification to manager
        if (manager != null) {
            notificationService.createNotification(
                    manager,
                    "⚠️ Executive Inquiry: Performance & Attendance for " + employee.getFullName(),
                    "System Admin requires official manager justification regarding non-attendance/low readiness (32%) for "
                            + employee.getFullName() + " (" + employee.getEmail() + "). Inquiry details: " + req.getInquiryQuestion(),
                    "RISK_ALERT",
                    "/team-readiness",
                    employee.getId(),
                    adminUser
            );
        }

        // Update runtime state
        escalationStatusMap.put(employee.getId(), "INQUIRY_SENT");
        inquiryReasonMap.put(employee.getId(), req.getInquiryQuestion());
        managerExplanationMap.put(employee.getId(), "Manager Sarah Jenkins submitted: Employee cited emergency medical duty during assessment window.");

        EmployeePerformanceDto dto = new EmployeePerformanceDto();
        dto.setUserId(employee.getId());
        dto.setFullName(employee.getFullName());
        dto.setEmail(employee.getEmail());
        populatePerformanceMetrics(employee, dto);
        dto.setEscalationStatus("INQUIRY_SENT");
        dto.setInquiryReason(req.getInquiryQuestion());
        dto.setManagerExplanation(managerExplanationMap.get(employee.getId()));
        return dto;
    }

    @Transactional
    public EmployeePerformanceDto acceptReason(AcceptReasonRequest req) {
        User employee = userRepository.findById(req.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", req.getUserId()));

        Long currentAdminId = SecurityUtils.getCurrentUserId();
        User adminUser = currentAdminId != null ? userRepository.findById(currentAdminId).orElse(null) : null;

        EmployeeProfile profile = employeeProfileRepository.findByUserId(employee.getId()).orElse(null);
        User manager = profile != null ? profile.getManager() : null;
        if (manager == null) {
            manager = userRepository.findByEmail("manager.eng@orgkgi.dev").orElse(null);
        }

        int extDays = req.getExtensionDays() != null ? req.getExtensionDays() : 30;

        // Dispatch notifications to Employee and Manager
        notificationService.createNotification(
                employee,
                "✅ Assessment Justification Accepted: " + extDays + "-Day Extension Granted",
                "Executive Administration has reviewed and accepted your manager's explanation. You have been granted a "
                        + extDays + "-day extension to complete your diagnostic quiz and skill verification.",
                "GENERAL",
                "/dashboard",
                employee.getId(),
                adminUser
        );

        if (manager != null) {
            notificationService.createNotification(
                    manager,
                    "✅ Justification Approved: Extension Granted for " + employee.getFullName(),
                    "Executive Administration approved your justification for " + employee.getFullName()
                            + ". A formal " + extDays + "-day grace period has been recorded in talent governance.",
                    "GENERAL",
                    "/team-readiness",
                    employee.getId(),
                    adminUser
            );
        }

        escalationStatusMap.put(employee.getId(), "REASON_ACCEPTED");
        extensionDaysMap.put(employee.getId(), extDays);

        EmployeePerformanceDto dto = new EmployeePerformanceDto();
        dto.setUserId(employee.getId());
        dto.setFullName(employee.getFullName());
        dto.setEmail(employee.getEmail());
        populatePerformanceMetrics(employee, dto);
        dto.setEscalationStatus("REASON_ACCEPTED");
        dto.setExtensionDays(extDays);
        return dto;
    }

    @Transactional
    public Map<String, Object> grantReward(GrantRewardRequest req) {
        User recipient = userRepository.findById(req.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", req.getUserId()));

        Long currentAdminId = SecurityUtils.getCurrentUserId();
        User adminUser = currentAdminId != null ? userRepository.findById(currentAdminId).orElse(null) : null;

        String amountStr = req.getAmount() != null && req.getAmount() > 0 ? " ($" + Math.round(req.getAmount()) + ")" : "";
        String badge = req.getRewardType() + amountStr;

        // Record badge in state
        awardedBadgesMap.computeIfAbsent(recipient.getId(), k -> new ArrayList<>()).add(badge);

        // Dispatch celebratory notification to recipient
        notificationService.createNotification(
                recipient,
                "🌟 Corporate Excellence Award: " + req.getRewardType(),
                "Congratulations " + recipient.getFullName() + "! Executive Administration has awarded you: "
                        + req.getRewardType() + amountStr + ". Citation: " + (req.getCitation() != null ? req.getCitation() : "For outstanding contributions to organizational engineering excellence."),
                "GENERAL",
                "/dashboard",
                recipient.getId(),
                adminUser
        );

        Map<String, Object> response = new HashMap<>();
        response.put("status", "SUCCESS");
        response.put("recipientId", recipient.getId());
        response.put("recipientName", recipient.getFullName());
        response.put("award", badge);
        response.put("allBadges", awardedBadgesMap.get(recipient.getId()));
        return response;
    }

    @Transactional
    public Map<String, Object> appreciatePersonnel(AppreciatePersonnelRequest req) {
        User recipient = userRepository.findById(req.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", req.getUserId()));

        Long currentAdminId = SecurityUtils.getCurrentUserId();
        User adminUser = currentAdminId != null ? userRepository.findById(currentAdminId).orElse(null) : null;

        String category = req.getBadgeCategory() != null ? req.getBadgeCategory() : "Engineering Excellence";
        String message = req.getMessage();

        appreciationMessagesMap.computeIfAbsent(recipient.getId(), k -> new ArrayList<>()).add(message);

        // Dispatch executive praise notification
        notificationService.createNotification(
                recipient,
                "👏 Executive Praise & Recognition: " + category,
                "Executive Message from System Admin: " + message,
                "GENERAL",
                "/dashboard",
                recipient.getId(),
                adminUser
        );

        Map<String, Object> response = new HashMap<>();
        response.put("status", "SUCCESS");
        response.put("recipientId", recipient.getId());
        response.put("recipientName", recipient.getFullName());
        response.put("category", category);
        response.put("message", message);
        return response;
    }
}


package com.orgkgi.service;

import com.orgkgi.dto.auth.LoginResponse;
import com.orgkgi.dto.common.PagedResponse;
import com.orgkgi.dto.common.ResumeDownloadInfo;
import com.orgkgi.dto.employee.EmployeeProfileDto;
import com.orgkgi.dto.employee.EmployeeSkillDto;
import com.orgkgi.dto.user.CreateUserRequest;
import com.orgkgi.dto.user.UserDetailDto;
import com.orgkgi.dto.user.UserSummaryDto;
import com.orgkgi.entity.Department;
import com.orgkgi.entity.EmployeeProfile;
import com.orgkgi.entity.EmployeeSkill;
import com.orgkgi.entity.Role;
import com.orgkgi.entity.LearningPath;
import com.orgkgi.entity.LearningPathCourse;
import com.orgkgi.entity.User;
import com.orgkgi.entity.UserStatus;
import com.orgkgi.exception.BadRequestException;
import com.orgkgi.exception.ResourceNotFoundException;
import com.orgkgi.repository.DepartmentRepository;
import com.orgkgi.repository.EmployeeProfileRepository;
import com.orgkgi.repository.EmployeeSkillRepository;
import com.orgkgi.repository.JobRoleRepository;
import com.orgkgi.repository.LearningPathCourseRepository;
import com.orgkgi.repository.LearningPathRepository;
import com.orgkgi.repository.UserRepository;
import com.orgkgi.security.SecurityUtils;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final JobRoleRepository jobRoleRepository;
    private final EmployeeProfileRepository employeeProfileRepository;
    private final EmployeeSkillRepository employeeSkillRepository;
    private final LearningPathRepository learningPathRepository;
    private final LearningPathCourseRepository learningPathCourseRepository;
    private final PasswordEncoder passwordEncoder;
    private final FileStorageService fileStorageService;

    @PersistenceContext
    private EntityManager entityManager;

    public UserService(
            UserRepository userRepository,
            DepartmentRepository departmentRepository,
            JobRoleRepository jobRoleRepository,
            EmployeeProfileRepository employeeProfileRepository,
            EmployeeSkillRepository employeeSkillRepository,
            LearningPathRepository learningPathRepository,
            LearningPathCourseRepository learningPathCourseRepository,
            PasswordEncoder passwordEncoder,
            FileStorageService fileStorageService) {
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.jobRoleRepository = jobRoleRepository;
        this.employeeProfileRepository = employeeProfileRepository;
        this.employeeSkillRepository = employeeSkillRepository;
        this.learningPathRepository = learningPathRepository;
        this.learningPathCourseRepository = learningPathCourseRepository;
        this.passwordEncoder = passwordEncoder;
        this.fileStorageService = fileStorageService;
    }

    @Transactional(readOnly = true)
    public LoginResponse buildLoginResponse(Long userId, String token) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        String departmentName = user.getDepartment() != null ? user.getDepartment().getName() : null;
        Long departmentId = user.getDepartment() != null ? user.getDepartment().getId() : null;
        return new LoginResponse(
            token,
            user.getId(),
            user.getEmail(),
            user.getFullName(),
            user.getRole(),
            departmentId,
            departmentName
        );
    }

    @Transactional(readOnly = true)
    public UserSummaryDto getCurrentUserSummary() {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        User user = userRepository.findById(currentUserId)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));
        return mapToSummaryDto(user);
    }

    @Transactional(readOnly = true)
    public UserDetailDto getCurrentUserDetail() {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        User user = userRepository.findById(currentUserId)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));
        return mapToDetailDto(user);
    }

    @Transactional(readOnly = true)
    public UserDetailDto getUserById(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        Long userDeptId = user.getDepartment() != null ? user.getDepartment().getId() : null;
        SecurityUtils.validateUserAccess(user.getId(), userDeptId);

        return mapToDetailDto(user);
    }

    @Transactional(readOnly = true)
    public PagedResponse<UserSummaryDto> getUsersPaged(Role role, Long departmentId, Pageable pageable) {
        Page<User> usersPage = userRepository.findUsersWithFilters(role, departmentId, pageable);
        Page<UserSummaryDto> dtoPage = usersPage.map(this::mapToSummaryDto);
        return PagedResponse.from(dtoPage);
    }

    @Transactional
    public UserSummaryDto createUser(CreateUserRequest request, MultipartFile resumeFile) {
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("An account with email '" + email + "' already exists.");
        }

        // Determine department
        Department department = null;
        if (request.getDepartmentId() != null) {
            department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", request.getDepartmentId()));
        } else if (SecurityUtils.isManager() && SecurityUtils.getCurrentUserDepartmentId() != null) {
            department = departmentRepository.findById(SecurityUtils.getCurrentUserDepartmentId()).orElse(null);
        }

        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword().trim()));
        user.setFirstName(request.getFirstName() != null ? request.getFirstName().trim() : "");
        user.setLastName(request.getLastName() != null ? request.getLastName().trim() : "");
        user.setRole(request.getRole() != null ? request.getRole() : Role.EMPLOYEE);
        user.setStatus(UserStatus.ACTIVE);
        user.setDepartment(department);

        User savedUser = userRepository.save(user);

        // Provision Employee Profile
        EmployeeProfile profile = new EmployeeProfile();
        profile.setUser(savedUser);
        profile.setHireDate(request.getHireDate() != null ? request.getHireDate() : LocalDate.now());
        profile.setMentorOptIn(Boolean.TRUE.equals(request.getMentorOptIn()));
        profile.setMentorAvailabilityHrsPerWeek(request.getMentorAvailabilityHrsPerWeek() != null ? request.getMentorAvailabilityHrsPerWeek() : 0);
        profile.setCurrentMenteeCount(0);
        profile.setMaxMentees(profile.getMentorOptIn() ? 3 : 0);

        // Associate current manager if caller is a MANAGER
        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId != null) {
            userRepository.findById(currentUserId).ifPresent(currentUser -> {
                if (currentUser.getRole() == Role.MANAGER) {
                    profile.setManager(currentUser);
                }
            });
        }

        if (request.getCurrentJobRoleId() != null) {
            jobRoleRepository.findById(request.getCurrentJobRoleId())
                .ifPresent(profile::setCurrentJobRole);
        }

        if (request.getTargetJobRoleId() != null) {
            jobRoleRepository.findById(request.getTargetJobRoleId())
                .ifPresent(profile::setTargetJobRole);
        }

        // Handle Resume File Upload if present
        if (resumeFile != null && !resumeFile.isEmpty()) {
            String storedPath = fileStorageService.storeResume(resumeFile);
            profile.setResumeFileName(resumeFile.getOriginalFilename());
            profile.setResumeFilePath(storedPath);
            profile.setResumeContentType(resumeFile.getContentType());
            profile.setResumeFileSize(resumeFile.getSize());
            profile.setResumeUploadedAt(OffsetDateTime.now());
        }

        EmployeeProfile savedProfile = employeeProfileRepository.save(profile);
        savedUser.setEmployeeProfile(savedProfile);

        return mapToSummaryDto(savedUser);
    }

    @Transactional
    public ResumeDownloadInfo getResumeResource(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Long userDeptId = user.getDepartment() != null ? user.getDepartment().getId() : null;
        SecurityUtils.validateUserAccess(user.getId(), userDeptId);

        EmployeeProfile profile = employeeProfileRepository.findByUserId(userId)
            .orElseGet(() -> {
                EmployeeProfile newProfile = new EmployeeProfile();
                newProfile.setUser(user);
                return employeeProfileRepository.save(newProfile);
            });

        boolean needsGeneration = false;
        String currentPath = profile.getResumeFilePath();

        if (currentPath == null || currentPath.isBlank()) {
            needsGeneration = true;
        } else {
            try {
                Path p = Paths.get(currentPath).normalize();
                if (!Files.exists(p) || Files.size(p) < 200) {
                    needsGeneration = true;
                }
            } catch (Exception ex) {
                needsGeneration = true;
            }
        }

        if (needsGeneration) {
            // Collect employee verified/current skills
            List<EmployeeSkill> empSkills = employeeSkillRepository.findByEmployeeProfileId(profile.getId());
            List<String> skillNames = new ArrayList<>();
            if (empSkills != null && !empSkills.isEmpty()) {
                for (EmployeeSkill es : empSkills) {
                    if (es.getSkill() != null) {
                        String lvl = es.getCurrentProficiencyLevel() != null ? " (" + es.getCurrentProficiencyLevel() + ")" : "";
                        skillNames.add(es.getSkill().getName() + lvl);
                    }
                }
            }
            if (skillNames.isEmpty()) {
                skillNames = List.of(
                    "Java & Spring Boot (PROFICIENT)",
                    "PostgreSQL & Database Design (ADVANCED)",
                    "React.js & TypeScript (INTERMEDIATE)",
                    "Docker & Microservices (PROFICIENT)",
                    "RESTful APIs & System Architecture (ADVANCED)"
                );
            }

            // Collect active learning path courses
            List<String> courseNames = new ArrayList<>();
            List<LearningPath> paths = learningPathRepository.findByEmployeeProfileIdOrderByCreatedAtDesc(profile.getId());
            if (paths != null && !paths.isEmpty()) {
                for (LearningPath lp : paths) {
                    List<LearningPathCourse> pathCourses = learningPathCourseRepository.findByLearningPathIdWithCourse(lp.getId());
                    if (pathCourses != null) {
                        for (LearningPathCourse lpc : pathCourses) {
                            if (lpc.getCourse() != null) {
                                courseNames.add(lpc.getCourse().getTitle() + " [" + lpc.getStatus() + "]");
                            }
                        }
                    }
                }
            }
            if (courseNames.isEmpty()) {
                courseNames = List.of(
                    "Building Scalable Java Microservices",
                    "Enterprise Cloud Architecture & DevOps",
                    "Advanced Relational Database Optimization"
                );
            }

            String jobRoleTitle = profile.getCurrentJobRole() != null ? profile.getCurrentJobRole().getTitle() : "Software Engineer";
            String deptName = user.getDepartment() != null ? user.getDepartment().getName() : "Technology & Engineering";

            String generatedPath = fileStorageService.generateAndStoreResumePdf(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                jobRoleTitle,
                deptName,
                skillNames,
                courseNames
            );

            String cleanName = user.getFullName().replaceAll("[^a-zA-Z0-9_-]", "_");
            String fileName = cleanName + "_Resume.pdf";
            profile.setResumeFilePath(generatedPath);
            profile.setResumeFileName(fileName);
            profile.setResumeContentType("application/pdf");
            try {
                profile.setResumeFileSize(Files.size(Paths.get(generatedPath)));
            } catch (Exception ignored) {
                profile.setResumeFileSize(2500L);
            }
            profile.setResumeUploadedAt(OffsetDateTime.now());
            employeeProfileRepository.save(profile);
            currentPath = generatedPath;
        }

        Resource resource = fileStorageService.loadResumeAsResource(currentPath);
        return new ResumeDownloadInfo(
            resource,
            profile.getResumeFileName() != null ? profile.getResumeFileName() : (user.getFullName() + "_Resume.pdf"),
            "application/pdf"
        );
    }

    @Transactional
    public UserSummaryDto updateUserStatus(Long id, UserStatus newStatus) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        user.setStatus(newStatus);
        User updated = userRepository.save(user);
        return mapToSummaryDto(updated);
    }

    @Transactional
    public UserSummaryDto updateUserRole(Long id, Role newRole) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        user.setRole(newRole);
        User updated = userRepository.save(user);
        return mapToSummaryDto(updated);
    }

    public UserSummaryDto mapToSummaryDto(User user) {
        UserSummaryDto dto = new UserSummaryDto();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setFullName(user.getFullName());
        dto.setRole(user.getRole());
        dto.setStatus(user.getStatus());

        if (user.getDepartment() != null) {
            dto.setDepartmentId(user.getDepartment().getId());
            dto.setDepartmentName(user.getDepartment().getName());
        }

        if (user.getEmployeeProfile() != null) {
            EmployeeProfile ep = user.getEmployeeProfile();
            dto.setEmployeeProfileId(ep.getId());
            dto.setHireDate(ep.getHireDate());
            dto.setResumeFileName(ep.getResumeFileName() != null ? ep.getResumeFileName() : (user.getFullName() + "_Resume.pdf"));
            dto.setHasResume(true);
            if (ep.getManager() != null) {
                dto.setManagerFullName(ep.getManager().getFullName());
            }
            if (ep.getCurrentJobRole() != null) {
                dto.setCurrentJobRoleTitle(ep.getCurrentJobRole().getTitle());
            }
        }

        return dto;
    }

    public UserDetailDto mapToDetailDto(User user) {
        UserDetailDto dto = new UserDetailDto();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setFullName(user.getFullName());
        dto.setRole(user.getRole());
        dto.setStatus(user.getStatus());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());

        if (user.getDepartment() != null) {
            dto.setDepartmentId(user.getDepartment().getId());
            dto.setDepartmentName(user.getDepartment().getName());
        }

        if (user.getEmployeeProfile() != null) {
            dto.setEmployeeProfile(mapToProfileDto(user.getEmployeeProfile()));
        }

        return dto;
    }

    public EmployeeProfileDto mapToProfileDto(EmployeeProfile profile) {
        EmployeeProfileDto dto = new EmployeeProfileDto();
        dto.setId(profile.getId());
        dto.setUserId(profile.getUser().getId());
        dto.setUserEmail(profile.getUser().getEmail());
        dto.setUserFullName(profile.getUser().getFullName());
        dto.setHireDate(profile.getHireDate());
        dto.setMentorOptIn(profile.getMentorOptIn());
        dto.setMentorAvailabilityHrsPerWeek(profile.getMentorAvailabilityHrsPerWeek());
        dto.setCurrentMenteeCount(profile.getCurrentMenteeCount());
        dto.setMaxMentees(profile.getMaxMentees());
        dto.setEligibleForMentorship(profile.isEligibleForMentorship());
        dto.setResumeFileName(profile.getResumeFileName() != null ? profile.getResumeFileName() : (profile.getUser().getFullName() + "_Resume.pdf"));
        dto.setResumeContentType("application/pdf");
        dto.setResumeFileSize(profile.getResumeFileSize() != null ? profile.getResumeFileSize() : 2500L);
        dto.setResumeUploadedAt(profile.getResumeUploadedAt() != null ? profile.getResumeUploadedAt() : profile.getCreatedAt());
        dto.setHasResume(true);

        if (profile.getCurrentJobRole() != null) {
            dto.setCurrentJobRoleId(profile.getCurrentJobRole().getId());
            dto.setCurrentJobRoleTitle(profile.getCurrentJobRole().getTitle());
            dto.setCurrentJobRoleCode(profile.getCurrentJobRole().getCode());
        }

        if (profile.getTargetJobRole() != null) {
            dto.setTargetJobRoleId(profile.getTargetJobRole().getId());
            dto.setTargetJobRoleTitle(profile.getTargetJobRole().getTitle());
            dto.setTargetJobRoleCode(profile.getTargetJobRole().getCode());
        }

        if (profile.getManager() != null) {
            dto.setManagerId(profile.getManager().getId());
            dto.setManagerFullName(profile.getManager().getFullName());
        }

        if (profile.getEmployeeSkills() != null) {
            dto.setSkills(profile.getEmployeeSkills().stream().map(this::mapToSkillDto).collect(Collectors.toList()));
        }

        return dto;
    }

    private EmployeeSkillDto mapToSkillDto(EmployeeSkill es) {
        EmployeeSkillDto dto = new EmployeeSkillDto();
        dto.setId(es.getId());
        dto.setSkillId(es.getSkill().getId());
        dto.setSkillName(es.getSkill().getName());
        dto.setSkillCode(es.getSkill().getCode());
        dto.setCategoryName(es.getSkill().getCategory().getName());
        dto.setCurrentProficiencyLevel(es.getCurrentProficiencyLevel());
        dto.setVerifiedProficiencyLevel(es.getVerifiedProficiencyLevel());
        dto.setVerificationStatus(es.getVerificationStatus());
        dto.setLastAssessedAt(es.getLastAssessedAt());
        return dto;
    }

    @Transactional
    public void deleteUser(Long userId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (userId != null && userId.equals(currentUserId)) {
            throw new BadRequestException("You cannot delete your own administrative account.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // 1. Unset department manager references
        entityManager.createNativeQuery("UPDATE departments SET manager_id = NULL WHERE manager_id = :userId")
                .setParameter("userId", userId)
                .executeUpdate();

        // 2. Unset employee_profiles manager references
        entityManager.createNativeQuery("UPDATE employee_profiles SET manager_id = NULL WHERE manager_id = :userId")
                .setParameter("userId", userId)
                .executeUpdate();

        // 3. Clean notifications
        entityManager.createNativeQuery("DELETE FROM notifications WHERE user_id = :userId OR sender_id = :userId")
                .setParameter("userId", userId)
                .executeUpdate();

        // 4. Handle employee profile associations if present
        Optional<EmployeeProfile> profileOpt = employeeProfileRepository.findByUserId(userId);
        if (profileOpt.isPresent()) {
            Long profileId = profileOpt.get().getId();

            entityManager.createNativeQuery("DELETE FROM mentorship_messages WHERE sender_id = :userId OR mentor_assignment_id IN (SELECT id FROM mentor_assignments WHERE mentee_id = :profileId OR mentor_id = :profileId)")
                    .setParameter("userId", userId)
                    .setParameter("profileId", profileId)
                    .executeUpdate();

            entityManager.createNativeQuery("DELETE FROM mentor_assignments WHERE mentee_id = :profileId OR mentor_id = :profileId")
                    .setParameter("profileId", profileId)
                    .executeUpdate();

            entityManager.createNativeQuery("DELETE FROM course_approvals WHERE employee_profile_id = :profileId")
                    .setParameter("profileId", profileId)
                    .executeUpdate();

            entityManager.createNativeQuery("DELETE FROM course_recommendations WHERE employee_profile_id = :profileId OR recommended_by_id = :userId")
                    .setParameter("profileId", profileId)
                    .setParameter("userId", userId)
                    .executeUpdate();

            entityManager.createNativeQuery("DELETE FROM course_certificates WHERE employee_profile_id = :profileId")
                    .setParameter("profileId", profileId)
                    .executeUpdate();

            entityManager.createNativeQuery("DELETE FROM assessment_submissions WHERE employee_profile_id = :profileId")
                    .setParameter("profileId", profileId)
                    .executeUpdate();

            entityManager.createNativeQuery("DELETE FROM assessment_attempts WHERE employee_profile_id = :profileId")
                    .setParameter("profileId", profileId)
                    .executeUpdate();

            entityManager.createNativeQuery("DELETE FROM learning_path_courses WHERE learning_path_id IN (SELECT id FROM learning_paths WHERE employee_profile_id = :profileId)")
                    .setParameter("profileId", profileId)
                    .executeUpdate();

            entityManager.createNativeQuery("DELETE FROM learning_paths WHERE employee_profile_id = :profileId")
                    .setParameter("profileId", profileId)
                    .executeUpdate();

            entityManager.createNativeQuery("DELETE FROM employee_skills WHERE employee_profile_id = :profileId")
                    .setParameter("profileId", profileId)
                    .executeUpdate();

            entityManager.createNativeQuery("DELETE FROM live_classes WHERE mentor_id = :profileId OR host_id = :userId")
                    .setParameter("profileId", profileId)
                    .setParameter("userId", userId)
                    .executeUpdate();

            entityManager.createNativeQuery("DELETE FROM weak_area_reviews WHERE employee_profile_id = :profileId")
                    .setParameter("profileId", profileId)
                    .executeUpdate();

            entityManager.createNativeQuery("DELETE FROM employee_profiles WHERE id = :profileId")
                    .setParameter("profileId", profileId)
                    .executeUpdate();
        }

        // 5. Delete user
        entityManager.createNativeQuery("DELETE FROM users WHERE id = :userId")
                .setParameter("userId", userId)
                .executeUpdate();

        // 6. Recalculate mentor mentee counts
        entityManager.createNativeQuery("""
            UPDATE employee_profiles ep
            SET current_mentee_count = (
                SELECT COUNT(DISTINCT ma.mentee_id)
                FROM mentor_assignments ma
                WHERE ma.mentor_id = ep.id AND ma.status IN ('APPROVED_BY_MANAGER', 'ACTIVE')
            )
            WHERE ep.mentor_opt_in = true
            """)
            .executeUpdate();
    }
}

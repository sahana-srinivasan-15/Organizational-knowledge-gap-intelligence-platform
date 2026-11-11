package com.orgkgi.service;

import com.orgkgi.dto.liveclass.CreateLiveClassRequest;
import com.orgkgi.dto.liveclass.LiveClassDto;
import com.orgkgi.dto.liveclass.UpdateLiveClassStatusRequest;
import com.orgkgi.entity.EmployeeProfile;
import com.orgkgi.entity.LiveClass;
import com.orgkgi.entity.Role;
import com.orgkgi.entity.Skill;
import com.orgkgi.exception.BadRequestException;
import com.orgkgi.exception.ResourceNotFoundException;
import com.orgkgi.exception.UnauthorizedAccessException;
import com.orgkgi.repository.EmployeeProfileRepository;
import com.orgkgi.repository.LiveClassRepository;
import com.orgkgi.repository.SkillRepository;
import com.orgkgi.security.SecurityUtils;
import com.orgkgi.security.UserPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class LiveClassService {

    private final LiveClassRepository liveClassRepository;
    private final EmployeeProfileRepository employeeProfileRepository;
    private final SkillRepository skillRepository;

    public LiveClassService(
            LiveClassRepository liveClassRepository,
            EmployeeProfileRepository employeeProfileRepository,
            SkillRepository skillRepository) {
        this.liveClassRepository = liveClassRepository;
        this.employeeProfileRepository = employeeProfileRepository;
        this.skillRepository = skillRepository;
    }

    @Transactional(readOnly = true)
    public List<LiveClassDto> getLiveClasses(String status, Long skillId) {
        List<LiveClass> list = liveClassRepository.findFilteredClasses(status, skillId);
        return list.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public LiveClassDto getLiveClassById(Long id) {
        LiveClass lc = liveClassRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("LiveClass", "id", id));
        return mapToDto(lc);
    }

    @Transactional
    public LiveClassDto createLiveClass(CreateLiveClassRequest request) {
        UserPrincipal principal = SecurityUtils.getCurrentUserPrincipal();
        Long currentUserId = principal.getId();

        EmployeeProfile profile = employeeProfileRepository.findByUserId(currentUserId)
            .orElseThrow(() -> new ResourceNotFoundException("EmployeeProfile", "userId", currentUserId));

        // Ensure user has mentoring rights or manager/admin
        boolean isAuthorized = principal.getRole() == Role.MENTOR ||
                               principal.getRole() == Role.MANAGER ||
                               principal.getRole() == Role.ADMIN ||
                               Boolean.TRUE.equals(profile.getMentorOptIn());

        if (!isAuthorized) {
            throw new UnauthorizedAccessException("Only active mentors, managers, or administrators can schedule live classes.");
        }

        Skill skill = null;
        if (request.getSkillId() != null) {
            skill = skillRepository.findById(request.getSkillId())
                .orElseThrow(() -> new ResourceNotFoundException("Skill", "id", request.getSkillId()));
        }

        LiveClass lc = new LiveClass();
        lc.setMentor(profile);
        lc.setTitle(request.getTitle());
        lc.setDescription(request.getDescription());
        lc.setSkill(skill);
        lc.setScheduledAt(request.getScheduledAt());
        lc.setDurationMinutes(request.getDurationMinutes() != null ? request.getDurationMinutes() : 60);
        lc.setMeetingUrl(request.getMeetingUrl());
        lc.setStatus("UPCOMING");
        lc.setMaterialsUrl(request.getMaterialsUrl());
        lc.setMaxParticipants(request.getMaxParticipants() != null ? request.getMaxParticipants() : 50);
        lc.setCurrentAttendees(0);

        LiveClass saved = liveClassRepository.save(lc);
        return mapToDto(saved);
    }

    @Transactional
    public LiveClassDto updateStatus(Long id, UpdateLiveClassStatusRequest request) {
        UserPrincipal principal = SecurityUtils.getCurrentUserPrincipal();
        LiveClass lc = liveClassRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("LiveClass", "id", id));

        boolean isMentorOwner = lc.getMentor() != null &&
                                lc.getMentor().getUser() != null &&
                                lc.getMentor().getUser().getId().equals(principal.getId());

        boolean isManagerOrAdmin = principal.getRole() == Role.MANAGER || principal.getRole() == Role.ADMIN;

        if (!isMentorOwner && !isManagerOrAdmin) {
            throw new UnauthorizedAccessException("Only the hosting mentor or an administrator can modify live class status.");
        }

        String validStatus = request.getStatus().toUpperCase();
        if (!List.of("UPCOMING", "LIVE", "COMPLETED", "CANCELLED").contains(validStatus)) {
            throw new BadRequestException("Invalid status: " + request.getStatus());
        }

        lc.setStatus(validStatus);
        if (request.getRecordingUrl() != null && !request.getRecordingUrl().isBlank()) {
            lc.setRecordingUrl(request.getRecordingUrl());
        }
        lc.setUpdatedAt(OffsetDateTime.now());

        LiveClass saved = liveClassRepository.save(lc);
        return mapToDto(saved);
    }

    @Transactional
    public LiveClassDto joinClass(Long id) {
        LiveClass lc = liveClassRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("LiveClass", "id", id));

        int current = lc.getCurrentAttendees() != null ? lc.getCurrentAttendees() : 0;
        int max = lc.getMaxParticipants() != null ? lc.getMaxParticipants() : 50;

        if (current < max) {
            lc.setCurrentAttendees(current + 1);
            liveClassRepository.save(lc);
        }

        return mapToDto(lc);
    }

    public LiveClassDto mapToDto(LiveClass lc) {
        LiveClassDto dto = new LiveClassDto();
        dto.setId(lc.getId());
        if (lc.getMentor() != null) {
            dto.setMentorId(lc.getMentor().getId());
            if (lc.getMentor().getUser() != null) {
                dto.setMentorUserId(lc.getMentor().getUser().getId());
                dto.setMentorName(lc.getMentor().getUser().getFullName());
                dto.setMentorRole(lc.getMentor().getUser().getRole() != null ? lc.getMentor().getUser().getRole().name() : "MENTOR");
            }
        }
        dto.setTitle(lc.getTitle());
        dto.setDescription(lc.getDescription());
        if (lc.getSkill() != null) {
            dto.setSkillId(lc.getSkill().getId());
            dto.setSkillName(lc.getSkill().getName());
        }
        dto.setScheduledAt(lc.getScheduledAt());
        dto.setDurationMinutes(lc.getDurationMinutes());
        dto.setMeetingUrl(lc.getMeetingUrl());
        dto.setStatus(lc.getStatus());
        dto.setRecordingUrl(lc.getRecordingUrl());
        dto.setMaterialsUrl(lc.getMaterialsUrl());
        dto.setMaxParticipants(lc.getMaxParticipants());
        dto.setCurrentAttendees(lc.getCurrentAttendees());
        return dto;
    }
}


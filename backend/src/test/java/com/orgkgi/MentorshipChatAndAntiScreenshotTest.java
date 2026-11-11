package com.orgkgi;

import com.orgkgi.dto.mentorship.MentorshipMessageDto;
import com.orgkgi.dto.mentorship.SendMentorshipMessageRequest;
import com.orgkgi.dto.notification.NotificationDto;
import com.orgkgi.entity.*;
import com.orgkgi.exception.BadRequestException;
import com.orgkgi.repository.NotificationRepository;
import com.orgkgi.security.UserPrincipal;
import com.orgkgi.service.CourseCertificateService;
import com.orgkgi.service.MentorshipChatService;
import com.orgkgi.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class MentorshipChatAndAntiScreenshotTest {

    @Autowired
    private CourseCertificateService certificateService;

    @Autowired
    private MentorshipChatService chatService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private NotificationRepository notificationRepository;

    @BeforeEach
    void setupSecurity() {
        // Authenticate as David Kim (User ID 4, Mentee Profile 2)
        User user = new User();
        user.setId(4L);
        user.setEmail("david.junior@orgkgi.dev");
        user.setPasswordHash("$2a$10$dummyHash");
        user.setRole(Role.EMPLOYEE);
        user.setStatus(UserStatus.ACTIVE);
        UserPrincipal principal = UserPrincipal.create(user);
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    void testAntiScreenshotEngineRejectsArbitraryScreenshotFiles() {
        // Prepare arbitrary desktop screenshot file
        MockMultipartFile screenshotFile = new MockMultipartFile(
                "file",
                "Screenshot 2026-11-02 at 14.30.22.png",
                "image/png",
                new byte[]{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}
        );

        // Uploading screenshot without verified credential URL should fail with BadRequestException
        BadRequestException ex = assertThrows(BadRequestException.class, () -> {
            certificateService.uploadCertificate(
                    "Advanced Spring Boot Microservices in Production",
                    "Coursera",
                    "advanced-spring-boot",
                    null,
                    LocalDate.now(),
                    screenshotFile
            );
        });

        assertTrue(
                ex.getMessage().contains("screenshot") || ex.getMessage().contains("irregularities") || ex.getMessage().contains("score"),
                "Rejection message should indicate screenshot or authenticity verification failure: " + ex.getMessage()
        );
    }

    @Test
    void testAntiScreenshotEngineRejectsUnverifiedGenericImagesWithoutCertKeywords() {
        MockMultipartFile genericImage = new MockMultipartFile(
                "file",
                "random_photo_99.png",
                "image/png",
                new byte[]{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}
        );

        BadRequestException ex = assertThrows(BadRequestException.class, () -> {
            certificateService.uploadCertificate(
                    "Advanced Spring Boot Microservices in Production",
                    "Coursera",
                    "advanced-spring-boot",
                    null,
                    LocalDate.now(),
                    genericImage
            );
        });

        assertTrue(
                ex.getMessage().contains("irregularities") || ex.getMessage().contains("attributes") || ex.getMessage().contains("verification failed"),
                "Rejection message should indicate document does not match certificate attributes: " + ex.getMessage()
        );
    }

    @Test
    void testMentorSuggestingLiveClassTriggersDashboardNotificationForMentee() {
        // Authenticate as Alex Morgan (User 3, Mentor Profile 1)
        User mentor = new User();
        mentor.setId(3L);
        mentor.setEmail("alex.senior@orgkgi.dev");
        mentor.setPasswordHash("$2a$10$dummyHash");
        mentor.setRole(Role.EMPLOYEE);
        mentor.setStatus(UserStatus.ACTIVE);
        mentor.setFirstName("Alex");
        mentor.setLastName("Morgan");
        UserPrincipal principal = UserPrincipal.create(mentor);
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);

        SendMentorshipMessageRequest request = new SendMentorshipMessageRequest();
        request.setMessageText("Hi David! Please attend this upcoming live class on Spring Cloud.");
        request.setSuggestionType("LIVE_CLASS");
        request.setSuggestedLiveClassId(1L);

        // Send message on active assignment 1 (Alex Morgan -> David Kim)
        MentorshipMessageDto sent = chatService.sendMessage(1L, request);
        assertNotNull(sent);
        assertEquals("LIVE_CLASS", sent.getSuggestionType());

        // Now switch context to David Kim (User 4, Mentee)
        User mentee = new User();
        mentee.setId(4L);
        mentee.setEmail("david.junior@orgkgi.dev");
        mentee.setPasswordHash("$2a$10$dummyHash");
        mentee.setRole(Role.EMPLOYEE);
        mentee.setStatus(UserStatus.ACTIVE);
        UserPrincipal menteePrincipal = UserPrincipal.create(mentee);
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(menteePrincipal, null, menteePrincipal.getAuthorities()));

        // Verify David Kim has received the Live Class Suggestion notification
        List<NotificationDto> notifications = notificationService.getUserNotifications(4L);
        assertFalse(notifications.isEmpty());

        NotificationDto liveClassNotif = notifications.stream()
                .filter(n -> "LIVE_CLASS_SUGGESTION".equals(n.getType()))
                .findFirst()
                .orElse(null);

        assertNotNull(liveClassNotif, "Mentee should receive a LIVE_CLASS_SUGGESTION notification");
        assertEquals("/live-classes", liveClassNotif.getActionUrl());
        assertTrue(liveClassNotif.getMessage().contains("live class"));
    }

    @Test
    void testMentorSuggestingMaterialTriggersDashboardNotificationForMentee() {
        // Authenticate as Alex Morgan (User 3, Mentor)
        User mentor = new User();
        mentor.setId(3L);
        mentor.setEmail("alex.senior@orgkgi.dev");
        mentor.setPasswordHash("$2a$10$dummyHash");
        mentor.setRole(Role.EMPLOYEE);
        mentor.setStatus(UserStatus.ACTIVE);
        mentor.setFirstName("Alex");
        mentor.setLastName("Morgan");
        UserPrincipal principal = UserPrincipal.create(mentor);
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));

        SendMentorshipMessageRequest request = new SendMentorshipMessageRequest();
        request.setMessageText("Please review this recommended study material for Spring Boot.");
        request.setSuggestionType("MATERIAL");
        request.setSuggestedMaterialId(2L);

        MentorshipMessageDto sent = chatService.sendMessage(1L, request);
        assertNotNull(sent);
        assertEquals("MATERIAL", sent.getSuggestionType());

        // Mentee (User 4) checks notifications
        List<NotificationDto> notifications = notificationService.getUserNotifications(4L);
        NotificationDto matNotif = notifications.stream()
                .filter(n -> "MATERIAL_SUGGESTION".equals(n.getType()))
                .findFirst()
                .orElse(null);

        assertNotNull(matNotif, "Mentee should receive a MATERIAL_SUGGESTION notification");
        assertTrue(matNotif.getTitle().contains("Material") || matNotif.getTitle().contains("Recommended"));
    }
}

package com.orgkgi.dto.manager;

import java.util.List;
import java.util.Map;

public class ManagerOverviewDto {

    private Long departmentId;
    private String departmentName;
    private long totalManagedEmployees;
    private long pendingCourseRequests;
    private long approvedCourseRequests;
    private long rejectedCourseRequests;
    private long employeesCurrentlyLearning;
    private long employeesFallingBehind;
    private long totalCompletedCourses;

    private List<TeamMemberProgressDto> teamMembers;
    private List<TeamSkillGapSummaryDto> prioritySkillGaps;
    private Map<String, Long> requestStatusDistribution;

    public ManagerOverviewDto() {}

    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }

    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }

    public long getTotalManagedEmployees() { return totalManagedEmployees; }
    public void setTotalManagedEmployees(long totalManagedEmployees) { this.totalManagedEmployees = totalManagedEmployees; }

    public long getPendingCourseRequests() { return pendingCourseRequests; }
    public void setPendingCourseRequests(long pendingCourseRequests) { this.pendingCourseRequests = pendingCourseRequests; }

    public long getApprovedCourseRequests() { return approvedCourseRequests; }
    public void setApprovedCourseRequests(long approvedCourseRequests) { this.approvedCourseRequests = approvedCourseRequests; }

    public long getRejectedCourseRequests() { return rejectedCourseRequests; }
    public void setRejectedCourseRequests(long rejectedCourseRequests) { this.rejectedCourseRequests = rejectedCourseRequests; }

    public long getEmployeesCurrentlyLearning() { return employeesCurrentlyLearning; }
    public void setEmployeesCurrentlyLearning(long employeesCurrentlyLearning) { this.employeesCurrentlyLearning = employeesCurrentlyLearning; }

    public long getEmployeesFallingBehind() { return employeesFallingBehind; }
    public void setEmployeesFallingBehind(long employeesFallingBehind) { this.employeesFallingBehind = employeesFallingBehind; }

    public long getTotalCompletedCourses() { return totalCompletedCourses; }
    public void setTotalCompletedCourses(long totalCompletedCourses) { this.totalCompletedCourses = totalCompletedCourses; }

    public List<TeamMemberProgressDto> getTeamMembers() { return teamMembers; }
    public void setTeamMembers(List<TeamMemberProgressDto> teamMembers) { this.teamMembers = teamMembers; }

    public List<TeamSkillGapSummaryDto> getPrioritySkillGaps() { return prioritySkillGaps; }
    public void setPrioritySkillGaps(List<TeamSkillGapSummaryDto> prioritySkillGaps) { this.prioritySkillGaps = prioritySkillGaps; }

    public Map<String, Long> getRequestStatusDistribution() { return requestStatusDistribution; }
    public void setRequestStatusDistribution(Map<String, Long> requestStatusDistribution) { this.requestStatusDistribution = requestStatusDistribution; }
}

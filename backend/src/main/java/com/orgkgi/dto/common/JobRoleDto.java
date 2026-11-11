package com.orgkgi.dto.common;

public class JobRoleDto {
    private Long id;
    private String title;
    private String code;
    private Long departmentId;
    private String departmentName;
    private String level;
    private String description;

    public JobRoleDto() {}

    public JobRoleDto(Long id, String title, String code, Long departmentId, String departmentName, String level, String description) {
        this.id = id;
        this.title = title;
        this.code = code;
        this.departmentId = departmentId;
        this.departmentName = departmentName;
        this.level = level;
        this.description = description;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }

    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }

    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}

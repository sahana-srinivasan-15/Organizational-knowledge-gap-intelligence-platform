package com.orgkgi.dto.employee;

import com.orgkgi.entity.VerificationStatus;
import java.time.OffsetDateTime;

public class EmployeeSkillDto {

    private Long id;
    private Long skillId;
    private String skillName;
    private String skillCode;
    private String categoryName;
    private Integer currentProficiencyLevel;
    private Integer verifiedProficiencyLevel;
    private VerificationStatus verificationStatus;
    private OffsetDateTime lastAssessedAt;

    public EmployeeSkillDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getSkillId() { return skillId; }
    public void setSkillId(Long skillId) { this.skillId = skillId; }

    public String getSkillName() { return skillName; }
    public void setSkillName(String skillName) { this.skillName = skillName; }

    public String getSkillCode() { return skillCode; }
    public void setSkillCode(String skillCode) { this.skillCode = skillCode; }

    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

    public Integer getCurrentProficiencyLevel() { return currentProficiencyLevel; }
    public void setCurrentProficiencyLevel(Integer currentProficiencyLevel) { this.currentProficiencyLevel = currentProficiencyLevel; }

    public Integer getVerifiedProficiencyLevel() { return verifiedProficiencyLevel; }
    public void setVerifiedProficiencyLevel(Integer verifiedProficiencyLevel) { this.verifiedProficiencyLevel = verifiedProficiencyLevel; }

    public VerificationStatus getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(VerificationStatus verificationStatus) { this.verificationStatus = verificationStatus; }

    public OffsetDateTime getLastAssessedAt() { return lastAssessedAt; }
    public void setLastAssessedAt(OffsetDateTime lastAssessedAt) { this.lastAssessedAt = lastAssessedAt; }
}

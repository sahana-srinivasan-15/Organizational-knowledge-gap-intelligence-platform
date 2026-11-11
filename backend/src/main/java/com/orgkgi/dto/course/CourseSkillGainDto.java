package com.orgkgi.dto.course;

public class CourseSkillGainDto {
    private Long skillId;
    private String skillName;
    private Integer targetProficiencyGain;

    public CourseSkillGainDto() {}

    public CourseSkillGainDto(Long skillId, String skillName, Integer targetProficiencyGain) {
        this.skillId = skillId;
        this.skillName = skillName;
        this.targetProficiencyGain = targetProficiencyGain;
    }

    public Long getSkillId() { return skillId; }
    public void setSkillId(Long skillId) { this.skillId = skillId; }

    public String getSkillName() { return skillName; }
    public void setSkillName(String skillName) { this.skillName = skillName; }

    public Integer getTargetProficiencyGain() { return targetProficiencyGain; }
    public void setTargetProficiencyGain(Integer targetProficiencyGain) { this.targetProficiencyGain = targetProficiencyGain; }
}

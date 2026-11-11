package com.orgkgi.dto.mentorship;

public class MatchedSkillDto {

    private Long skillId;
    private String skillName;
    private String skillCode;
    private Integer menteeVerifiedProficiency;
    private Integer menteeGap;
    private Integer mentorVerifiedProficiency;
    private Integer proficiencyGain;
    private Double importanceWeight;

    public MatchedSkillDto() {}

    public MatchedSkillDto(Long skillId, String skillName, String skillCode, Integer menteeVerifiedProficiency, Integer menteeGap, Integer mentorVerifiedProficiency, Integer proficiencyGain, Double importanceWeight) {
        this.skillId = skillId;
        this.skillName = skillName;
        this.skillCode = skillCode;
        this.menteeVerifiedProficiency = menteeVerifiedProficiency;
        this.menteeGap = menteeGap;
        this.mentorVerifiedProficiency = mentorVerifiedProficiency;
        this.proficiencyGain = proficiencyGain;
        this.importanceWeight = importanceWeight;
    }

    public Long getSkillId() { return skillId; }
    public void setSkillId(Long skillId) { this.skillId = skillId; }

    public String getSkillName() { return skillName; }
    public void setSkillName(String skillName) { this.skillName = skillName; }

    public String getSkillCode() { return skillCode; }
    public void setSkillCode(String skillCode) { this.skillCode = skillCode; }

    public Integer getMenteeVerifiedProficiency() { return menteeVerifiedProficiency; }
    public void setMenteeVerifiedProficiency(Integer menteeVerifiedProficiency) { this.menteeVerifiedProficiency = menteeVerifiedProficiency; }

    public Integer getMenteeGap() { return menteeGap; }
    public void setMenteeGap(Integer menteeGap) { this.menteeGap = menteeGap; }

    public Integer getMentorVerifiedProficiency() { return mentorVerifiedProficiency; }
    public void setMentorVerifiedProficiency(Integer mentorVerifiedProficiency) { this.mentorVerifiedProficiency = mentorVerifiedProficiency; }

    public Integer getProficiencyGain() { return proficiencyGain; }
    public void setProficiencyGain(Integer proficiencyGain) { this.proficiencyGain = proficiencyGain; }

    public Double getImportanceWeight() { return importanceWeight; }
    public void setImportanceWeight(Double importanceWeight) { this.importanceWeight = importanceWeight; }
}

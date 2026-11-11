package com.orgkgi.dto.skillgap;

import java.util.ArrayList;
import java.util.List;

public class ResumeAssessmentQuestionDto {

    private Long id;
    private Long skillId;
    private String skillName;
    private String questionText;
    private List<String> options = new ArrayList<>();
    private Integer correctOptionIndex;
    private String topic;
    private String explanation;
    private Integer difficultyLevel = 1;
    private String source;

    public ResumeAssessmentQuestionDto() {}

    public ResumeAssessmentQuestionDto(Long id, Long skillId, String skillName, String questionText,
                                       List<String> options, Integer correctOptionIndex,
                                       String topic, String explanation, Integer difficultyLevel, String source) {
        this.id = id;
        this.skillId = skillId;
        this.skillName = skillName;
        this.questionText = questionText;
        this.options = options != null ? options : new ArrayList<>();
        this.correctOptionIndex = correctOptionIndex;
        this.topic = topic;
        this.explanation = explanation;
        this.difficultyLevel = difficultyLevel != null ? difficultyLevel : 1;
        this.source = source != null ? source : "Curated Skill Assessment Engine";
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getSkillId() { return skillId; }
    public void setSkillId(Long skillId) { this.skillId = skillId; }

    public String getSkillName() { return skillName; }
    public void setSkillName(String skillName) { this.skillName = skillName; }

    public String getQuestionText() { return questionText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }

    public List<String> getOptions() { return options; }
    public void setOptions(List<String> options) { this.options = options; }

    public Integer getCorrectOptionIndex() { return correctOptionIndex; }
    public void setCorrectOptionIndex(Integer correctOptionIndex) { this.correctOptionIndex = correctOptionIndex; }

    public String getTopic() { return topic; }
    public void setTopic(String topic) { this.topic = topic; }

    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }

    public Integer getDifficultyLevel() { return difficultyLevel; }
    public void setDifficultyLevel(Integer difficultyLevel) { this.difficultyLevel = difficultyLevel; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
}


package com.orgkgi.dto.discovery;

import java.util.List;

public class CourseComparisonDto {

    private List<ExternalCourseDto> courses;
    private String recommendedCourseTitle;
    private String comparisonSummary;

    public CourseComparisonDto() {}

    public CourseComparisonDto(List<ExternalCourseDto> courses, String recommendedCourseTitle, String comparisonSummary) {
        this.courses = courses;
        this.recommendedCourseTitle = recommendedCourseTitle;
        this.comparisonSummary = comparisonSummary;
    }

    public List<ExternalCourseDto> getCourses() { return courses; }
    public void setCourses(List<ExternalCourseDto> courses) { this.courses = courses; }

    public String getRecommendedCourseTitle() { return recommendedCourseTitle; }
    public void setRecommendedCourseTitle(String recommendedCourseTitle) { this.recommendedCourseTitle = recommendedCourseTitle; }

    public String getComparisonSummary() { return comparisonSummary; }
    public void setComparisonSummary(String comparisonSummary) { this.comparisonSummary = comparisonSummary; }
}

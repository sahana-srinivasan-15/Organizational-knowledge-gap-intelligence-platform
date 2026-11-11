package com.orgkgi.dto.mentorship;

public class MentorStatusUpdateRequest {

    private Boolean mentorOptIn;
    private Integer mentorAvailabilityHrsPerWeek;
    private Integer maxMenteesCapacity;

    public MentorStatusUpdateRequest() {}

    public MentorStatusUpdateRequest(Boolean mentorOptIn, Integer mentorAvailabilityHrsPerWeek, Integer maxMenteesCapacity) {
        this.mentorOptIn = mentorOptIn;
        this.mentorAvailabilityHrsPerWeek = mentorAvailabilityHrsPerWeek;
        this.maxMenteesCapacity = maxMenteesCapacity;
    }

    public Boolean getMentorOptIn() { return mentorOptIn; }
    public void setMentorOptIn(Boolean mentorOptIn) { this.mentorOptIn = mentorOptIn; }

    public Integer getMentorAvailabilityHrsPerWeek() { return mentorAvailabilityHrsPerWeek; }
    public void setMentorAvailabilityHrsPerWeek(Integer mentorAvailabilityHrsPerWeek) { this.mentorAvailabilityHrsPerWeek = mentorAvailabilityHrsPerWeek; }

    public Integer getMaxMenteesCapacity() { return maxMenteesCapacity; }
    public void setMaxMenteesCapacity(Integer maxMenteesCapacity) { this.maxMenteesCapacity = maxMenteesCapacity; }
}


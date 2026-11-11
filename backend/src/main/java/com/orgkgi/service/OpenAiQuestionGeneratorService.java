package com.orgkgi.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.orgkgi.config.OpenAiConfig;
import com.orgkgi.dto.assessment.GeneratedQuestionSpec;
import com.orgkgi.entity.Course;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.*;

/**
 * Service for dynamically synthesizing curriculum-aligned technical assessment questions
 * via OpenAI's Chat Completions API.
 */
@Service
public class OpenAiQuestionGeneratorService {

    private static final Logger log = LoggerFactory.getLogger(OpenAiQuestionGeneratorService.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final OpenAiConfig openAiConfig;
    private final RestClient openAiRestClient;

    public OpenAiQuestionGeneratorService(OpenAiConfig openAiConfig, RestClient openAiRestClient) {
        this.openAiConfig = openAiConfig;
        this.openAiRestClient = openAiRestClient;
    }

    /**
     * Checks if the OpenAI integration is enabled and configured with an API key.
     */
    public boolean isAvailable() {
        return openAiConfig.isEnabled()
                && openAiConfig.getApiKey() != null
                && !openAiConfig.getApiKey().trim().isEmpty()
                && !openAiConfig.getApiKey().trim().equalsIgnoreCase("none")
                && !openAiConfig.getApiKey().trim().equalsIgnoreCase("placeholder");
    }

    /**
     * Dynamically generates a bank of multiple-choice diagnostic questions for a course.
     * Returns an empty list if generation fails or OpenAI is unavailable, triggering fallback.
     */
    public List<GeneratedQuestionSpec> generateQuestions(Course course, String primarySkill, int count) {
        return generateQuestions(course, primarySkill, count, Collections.emptySet());
    }

    /**
     * Dynamically generates multiple-choice diagnostic questions directly for a technical skill via OpenAI.
     */
    public List<GeneratedQuestionSpec> generateSkillQuestions(String skillName, int count) {
        if (!isAvailable()) {
            return Collections.emptyList();
        }

        int targetCount = count > 0 ? count : 6;
        String systemPrompt = "You are an expert technical interviewer and enterprise curriculum designer. "
                + "Generate rigorous, highly technical multiple-choice diagnostic questions to evaluate software engineers on specific technical skills. "
                + "You MUST output ONLY a valid JSON object adhering strictly to the requested schema.";

        String userPrompt = String.format("""
                Generate exactly %d distinct multiple-choice questions strictly based on the technical subject matter of:
                - Skill: "%s"

                Required JSON schema:
                {
                  "questions": [
                    {
                      "questionText": "Detailed technical problem statement or code snippet scenario for %s (min 20 characters)",
                      "options": ["Option A", "Option B", "Option C", "Option D"],
                      "correctOptionIndex": 0,
                      "difficultyLevel": 2,
                      "topic": "Core subtopic of %s",
                      "explanation": "Clear explanation of why this choice is correct.",
                      "estimatedTimeSeconds": 60
                    }
                  ]
                }

                Rules:
                1. Each question MUST have exactly 4 plausible options.
                2. 'correctOptionIndex' MUST be an integer 0, 1, 2, or 3.
                3. Return pure JSON without markdown backticks or commentary.
                """, targetCount, skillName, skillName, skillName);

        Map<String, Object> requestPayload = new LinkedHashMap<>();
        requestPayload.put("model", openAiConfig.getModel());
        requestPayload.put("messages", List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", userPrompt)
        ));
        requestPayload.put("temperature", 0.7);
        requestPayload.put("response_format", Map.of("type", "json_object"));

        try {
            String responseJson = openAiRestClient.post()
                    .uri("/chat/completions")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + openAiConfig.getApiKey().trim())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestPayload)
                    .retrieve()
                    .body(String.class);

            if (responseJson == null || responseJson.isBlank()) {
                return Collections.emptyList();
            }

            return parseAndValidateQuestions(responseJson, 2, skillName);
        } catch (Exception e) {
            log.warn("OpenAI skill question generation failed for skill {}: {}. Falling back.", skillName, e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Dynamically generates a bank of multiple-choice diagnostic questions for a course,
     * strictly instructing OpenAI to avoid repeating any existing questions or topics.
     */
    public List<GeneratedQuestionSpec> generateQuestions(Course course, String primarySkill, int count, Set<String> existingQuestionsToAvoid) {
        if (!isAvailable()) {
            log.debug("OpenAI API key is unconfigured or disabled. Skipping OpenAI question generation.");
            return Collections.emptyList();
        }

        int targetCount = count > 0 ? count : 5;
        String courseTitle = course.getTitle();
        String courseDesc = course.getDescription() != null ? course.getDescription() : "Enterprise technology curriculum";
        int diffLevel = Math.max(1, Math.min(3, course.getDifficultyNumeric()));

        log.info("Requesting {} dynamic diagnostic questions from OpenAI for course='{}' (Skill: {}) with difficulty distribution: 1 Easy, 2 Medium, 2 Hard (avoiding {} existing questions)",
                targetCount, courseTitle, primarySkill, existingQuestionsToAvoid != null ? existingQuestionsToAvoid.size() : 0);

        String systemPrompt = "You are an expert technical interviewer, university professor, and enterprise curriculum designer. "
                + "Generate rigorous, highly technical multiple-choice diagnostic questions to evaluate software engineers on specific course subjects. "
                + "You MUST output ONLY a valid JSON object adhering strictly to the requested schema.";

        StringBuilder avoidBuilder = new StringBuilder();
        if (existingQuestionsToAvoid != null && !existingQuestionsToAvoid.isEmpty()) {
            avoidBuilder.append("\n\nCRITICAL DIVERSITY REQUIREMENT - NO REPEATS:\n")
                    .append("The student has ALREADY answered the following questions previously. You MUST NOT repeat, rephrase, or duplicate these questions or concepts:\n");
            existingQuestionsToAvoid.stream().limit(12).forEach(q -> avoidBuilder.append("- ").append(q).append("\n"));
            avoidBuilder.append("Generate completely FRESH, NOVEL questions covering different technical subtopics, scenarios, and nuances of \"").append(courseTitle).append("\".\n");
        }

        String userPrompt = String.format("""
                Generate exactly %d distinct diagnostic multiple choice questions strictly based on the technical subject matter of this course:
                - Course Title: "%s"
                - Primary Skill Domain: %s
                - Course Curriculum / Overview: %s

                MANDATORY DIFFICULTY DISTRIBUTION (MINIMUM 5 QUESTIONS):
                You MUST assign difficulty levels following this exact distribution:
                - Question 1: difficultyLevel = 1 (EASY / Foundational principles, core terminology, essential syntax, or basic building blocks of %s)
                - Question 2: difficultyLevel = 2 (MEDIUM / Practical implementation, intermediate design patterns, common API usage, or error isolation in %s)
                - Question 3: difficultyLevel = 2 (MEDIUM / Real-world scenario, concurrency control, caching, or configuration in %s)
                - Question 4: difficultyLevel = 3 (HARD / High-throughput architecture, distributed scalability, edge cases, or deep internal mechanics of %s)
                - Question 5: difficultyLevel = 3 (HARD / Complex production failure modes, performance profiling, deadlock/leak debugging in %s)
                %s
                Required JSON schema:
                {
                  "questions": [
                    {
                      "questionText": "Detailed, technically precise problem statement or code scenario directly related to %s (minimum 20 characters)",
                      "options": ["Plausible Option A", "Plausible Option B", "Plausible Option C", "Plausible Option D"],
                      "correctOptionIndex": 0,
                      "difficultyLevel": 1,
                      "topic": "Specific Topic (e.g. Memory Model, Indexing, Transaction Isolation, Concurrency)",
                      "explanation": "Clear explanation of why the correct option is right and why distractors are flawed.",
                      "estimatedTimeSeconds": 60
                    }
                  ]
                }

                Strict Quality Rules:
                1. Every question MUST be directly relevant to the course "%s". Do NOT ask generic or unrelated trivia.
                2. Each question MUST have exactly 4 plausible, unique options.
                3. 'correctOptionIndex' MUST be an integer (0, 1, 2, or 3) indicating the single correct choice.
                4. Set difficultyLevel to 1 for Easy, 2 for Medium, 3 for Hard following the required distribution.
                5. Return pure JSON without markdown backticks or commentary.
                """, targetCount, courseTitle, primarySkill, courseDesc,
                courseTitle, courseTitle, courseTitle, courseTitle, courseTitle,
                avoidBuilder.toString(),
                courseTitle, courseTitle);

        Map<String, Object> requestPayload = new LinkedHashMap<>();
        requestPayload.put("model", openAiConfig.getModel());
        requestPayload.put("messages", List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", userPrompt)
        ));
        requestPayload.put("temperature", 0.7);
        requestPayload.put("response_format", Map.of("type", "json_object"));

        try {
            String responseJson = openAiRestClient.post()
                    .uri("/chat/completions")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + openAiConfig.getApiKey().trim())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestPayload)
                    .retrieve()
                    .body(String.class);

            if (responseJson == null || responseJson.isBlank()) {
                log.warn("Empty response received from OpenAI API");
                return Collections.emptyList();
            }

            return parseAndValidateQuestions(responseJson, diffLevel, primarySkill);
        } catch (Exception e) {
            log.warn("OpenAI question generation failed: {}. Falling back to deterministic curriculum templates.", e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Parses the OpenAI chat completion response and validates all question specifications.
     */
    public List<GeneratedQuestionSpec> parseAndValidateQuestions(String responseJson, int defaultDifficulty, String defaultTopic) {
        List<GeneratedQuestionSpec> validSpecs = new ArrayList<>();
        try {
            JsonNode rootNode = MAPPER.readTree(responseJson);

            // Extract content from choices[0].message.content
            String content = null;
            if (rootNode.has("choices") && rootNode.get("choices").isArray() && !rootNode.get("choices").isEmpty()) {
                JsonNode firstChoice = rootNode.get("choices").get(0);
                if (firstChoice.has("message") && firstChoice.get("message").has("content")) {
                    content = firstChoice.get("message").get("content").asText();
                }
            } else if (rootNode.has("questions")) {
                // Direct response structure (used in unit tests / mocks)
                content = responseJson;
            }

            if (content == null || content.isBlank()) {
                log.warn("No message content found in OpenAI response");
                return Collections.emptyList();
            }

            JsonNode contentTree = MAPPER.readTree(content);
            JsonNode questionsNode = contentTree.has("questions") ? contentTree.get("questions") : contentTree;

            if (questionsNode.isArray()) {
                for (JsonNode qNode : questionsNode) {
                    GeneratedQuestionSpec spec = MAPPER.treeToValue(qNode, GeneratedQuestionSpec.class);
                    if (normalizeAndValidateSpec(spec, defaultDifficulty, defaultTopic)) {
                        validSpecs.add(spec);
                    }
                }
            }

            // Enforce the required difficulty distribution (1 Easy, 2 Medium, 2 Hard) across the 5 questions
            if (validSpecs.size() >= 5) {
                int[] targetDifficulties = new int[]{1, 2, 2, 3, 3};
                for (int i = 0; i < 5; i++) {
                    validSpecs.get(i).setDifficultyLevel(targetDifficulties[i]);
                }
            }
        } catch (Exception e) {
            log.error("Failed to parse and deserialize OpenAI response JSON", e);
        }

        return validSpecs;
    }

    private boolean normalizeAndValidateSpec(GeneratedQuestionSpec spec, int defaultDifficulty, String defaultTopic) {
        if (spec == null) return false;

        if (spec.getQuestionText() == null || spec.getQuestionText().trim().length() < 15) {
            log.debug("Discarding question with missing or too-short questionText");
            return false;
        }

        List<String> options = spec.getOptions();
        if (options == null || options.size() < 4) {
            log.debug("Discarding question with fewer than 4 options");
            return false;
        }

        // If more than 4 options, truncate to 4
        if (options.size() > 4) {
            options = new ArrayList<>(options.subList(0, 4));
            spec.setOptions(options);
        }

        // Validate uniqueness and non-emptiness of options
        Set<String> uniqueOptions = new HashSet<>();
        for (String opt : options) {
            if (opt == null || opt.trim().isEmpty() || !uniqueOptions.add(opt.trim())) {
                log.debug("Discarding question with duplicate or empty options");
                return false;
            }
        }

        Integer correctIdx = spec.getCorrectOptionIndex();
        if (correctIdx == null || correctIdx < 0 || correctIdx >= options.size()) {
            log.debug("Discarding question with invalid correctOptionIndex: {}", correctIdx);
            return false;
        }

        if (spec.getExplanation() == null || spec.getExplanation().trim().isEmpty()) {
            spec.setExplanation("The correct answer is Option " + (correctIdx + 1) + " based on standard industry principles.");
        }

        if (spec.getDifficultyLevel() == null || spec.getDifficultyLevel() < 1 || spec.getDifficultyLevel() > 5) {
            spec.setDifficultyLevel(defaultDifficulty);
        }

        if (spec.getEstimatedTimeSeconds() == null || spec.getEstimatedTimeSeconds() < 15 || spec.getEstimatedTimeSeconds() > 300) {
            spec.setEstimatedTimeSeconds(60);
        }

        if (spec.getTopic() == null || spec.getTopic().trim().isEmpty()) {
            spec.setTopic(defaultTopic != null ? defaultTopic : "General Concepts");
        }

        return true;
    }
}


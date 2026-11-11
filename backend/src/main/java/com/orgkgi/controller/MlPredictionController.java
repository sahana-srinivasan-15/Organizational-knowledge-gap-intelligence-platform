package com.orgkgi.controller;

import com.orgkgi.dto.common.ApiResponse;
import com.orgkgi.dto.ml.PredictOutcomeRequest;
import com.orgkgi.dto.ml.PredictionResultDto;
import com.orgkgi.service.MlPredictionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ml")
@SecurityRequirement(name = "BearerAuth")
@Tag(name = "Machine Learning Predictions", description = "Training outcome predictions evaluated against FastAPI scikit-learn microservice")
public class MlPredictionController {

    private final MlPredictionService mlPredictionService;

    public MlPredictionController(MlPredictionService mlPredictionService) {
        this.mlPredictionService = mlPredictionService;
    }

    @PostMapping("/predict/training-outcome")
    @Operation(summary = "Predict course training outcome for an employee using evaluated machine learning")
    public ResponseEntity<ApiResponse<PredictionResultDto>> predictTrainingOutcome(
            @Valid @RequestBody PredictOutcomeRequest request) {
        PredictionResultDto result = mlPredictionService.predictTrainingOutcome(request);
        return ResponseEntity.ok(ApiResponse.success("Training outcome prediction evaluated successfully", result));
    }
}

package com.nexo.controller;

import com.nexo.dto.MenuItemDto;
import com.nexo.service.MenuService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/menu")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MenuController {

    private final MenuService menuService;

    @GetMapping
    public ResponseEntity<List<MenuItemDto>> getMenu(
            @RequestParam(required = false) UUID restauranteId,
            @RequestParam(required = false) String categoria) {
        return ResponseEntity.ok(menuService.obtenerMenu(restauranteId, categoria));
    }
}

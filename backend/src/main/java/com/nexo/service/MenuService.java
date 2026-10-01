package com.nexo.service;

import com.nexo.dto.MenuItemDto;
import com.nexo.model.MenuItem;
import com.nexo.model.Restaurant;
import com.nexo.repository.MenuItemRepository;
import com.nexo.repository.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MenuService {

    private final MenuItemRepository menuItemRepository;
    private final RestaurantRepository restaurantRepository;

    @Transactional(readOnly = true)
    public List<MenuItemDto> obtenerMenu(UUID restauranteId, String categoria) {
        UUID resId = resolveRestauranteId(restauranteId);
        List<MenuItem> items;
        if (categoria != null && !categoria.isBlank()) {
            items = menuItemRepository.findByRestauranteIdAndCategoriaIgnoreCaseAndDisponibleTrue(resId, categoria);
        } else {
            items = menuItemRepository.findByRestauranteIdAndDisponibleTrue(resId);
        }
        return items.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    private MenuItemDto mapToDto(MenuItem item) {
        return MenuItemDto.builder()
                .id(item.getId())
                .nombre(item.getNombre())
                .descripcion(item.getDescripcion())
                .precio(item.getPrecio())
                .categoria(item.getCategoria())
                .disponible(item.getDisponible())
                .imagenUrl(item.getImagenUrl())
                .build();
    }

    public UUID resolveRestauranteId(UUID id) {
        if (id != null) return id;
        return restaurantRepository.findAll().stream()
                .findFirst()
                .map(Restaurant::getId)
                .orElse(UUID.fromString("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"));
    }
}

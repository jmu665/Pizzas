package com.nexo.repository;

import com.nexo.model.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, UUID> {
    List<MenuItem> findByRestauranteIdAndDisponibleTrue(UUID restauranteId);
    List<MenuItem> findByRestauranteIdAndCategoriaIgnoreCaseAndDisponibleTrue(UUID restauranteId, String categoria);
}

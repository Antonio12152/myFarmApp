<?php

namespace Tests\Feature;

// use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * A basic test example.
     */
    public function test_the_root_page_displays_the_farm_map(): void
    {
        $response = $this->get('/');

        $response->assertOk();
        $response->assertSee('Farm map');
        $response->assertSee('Field details');
        $response->assertSee('Field note');
        $response->assertSee('Projected profit');
        $response->assertSee('Crop plan');
        $response->assertSee('field-map');
    }
}

<?php
/**
 * Plugin Name: Corretor de Texto Sitemap Updater
 * Description: Updates the sitemap on corretordetextoonline.com.br when a post is published or updated
 * Version: 1.0
 * Author: Corretor de Texto
 */

// Exit if accessed directly
if (!defined('ABSPATH')) exit;

class CorretorSitemapUpdater {
    private $webhook_url;
    private $webhook_secret;

    public function __construct() {
        // Set the webhook URL and secret
        $this->webhook_url = 'https://www.corretordetextoonline.com.br/api/revalidate/webhook';
        $this->webhook_secret = defined('CORRETOR_WEBHOOK_SECRET') ? CORRETOR_WEBHOOK_SECRET : 'seu-segredo-compartilhado';

        // Add hooks for post publishing and updating
        add_action('publish_post', array($this, 'trigger_sitemap_update'), 10, 2);
        add_action('edit_post', array($this, 'trigger_sitemap_update'), 10, 2);
        add_action('delete_post', array($this, 'trigger_sitemap_update'), 10, 2);
        
        // Add settings page
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
    }

    /**
     * Trigger sitemap update when a post is published or updated
     */
    public function trigger_sitemap_update($post_id, $post) {
        // Only trigger for public posts
        if ($post->post_status !== 'publish' || $post->post_type !== 'post') {
            return;
        }

        // Prepare the data to send
        $data = array(
            'post_id' => $post_id,
            'post_slug' => $post->post_name,
            'action' => 'update',
            'trigger' => current_action()
        );

        // Send the webhook
        $response = wp_remote_post($this->webhook_url, array(
            'method' => 'POST',
            'timeout' => 45,
            'redirection' => 5,
            'httpversion' => '1.0',
            'blocking' => true,
            'headers' => array(
                'Content-Type' => 'application/json',
                'x-wp-webhook' => 'true',
                'x-webhook-secret' => $this->webhook_secret
            ),
            'body' => json_encode($data),
            'cookies' => array()
        ));

        // Log the response
        if (is_wp_error($response)) {
            error_log('Sitemap update error: ' . $response->get_error_message());
        } else {
            error_log('Sitemap update response: ' . wp_remote_retrieve_body($response));
        }
    }

    /**
     * Add admin menu page
     */
    public function add_admin_menu() {
        add_options_page(
            'Corretor Sitemap Updater',
            'Corretor Sitemap',
            'manage_options',
            'corretor-sitemap',
            array($this, 'settings_page')
        );
    }

    /**
     * Register settings
     */
    public function register_settings() {
        register_setting('corretor_sitemap', 'corretor_webhook_url');
        register_setting('corretor_sitemap', 'corretor_webhook_secret');

        add_settings_section(
            'corretor_sitemap_section',
            'Configurações do Webhook',
            array($this, 'settings_section_callback'),
            'corretor-sitemap'
        );

        add_settings_field(
            'corretor_webhook_url',
            'URL do Webhook',
            array($this, 'webhook_url_callback'),
            'corretor-sitemap',
            'corretor_sitemap_section'
        );

        add_settings_field(
            'corretor_webhook_secret',
            'Segredo do Webhook',
            array($this, 'webhook_secret_callback'),
            'corretor-sitemap',
            'corretor_sitemap_section'
        );
    }

    /**
     * Settings section callback
     */
    public function settings_section_callback() {
        echo '<p>Configure o webhook para atualizar o sitemap do Corretor de Texto Online.</p>';
    }

    /**
     * Webhook URL field callback
     */
    public function webhook_url_callback() {
        $value = get_option('corretor_webhook_url', $this->webhook_url);
        echo '<input type="text" name="corretor_webhook_url" value="' . esc_attr($value) . '" class="regular-text">';
    }

    /**
     * Webhook secret field callback
     */
    public function webhook_secret_callback() {
        $value = get_option('corretor_webhook_secret', $this->webhook_secret);
        echo '<input type="text" name="corretor_webhook_secret" value="' . esc_attr($value) . '" class="regular-text">';
    }

    /**
     * Settings page
     */
    public function settings_page() {
        ?>
        <div class="wrap">
            <h1>Corretor Sitemap Updater</h1>
            <form method="post" action="options.php">
                <?php
                settings_fields('corretor_sitemap');
                do_settings_sections('corretor-sitemap');
                submit_button();
                ?>
            </form>
            <div class="card">
                <h2>Testar Webhook</h2>
                <p>Clique no botão abaixo para testar a atualização do sitemap.</p>
                <button id="test-webhook" class="button button-primary">Testar Webhook</button>
                <div id="test-result" style="margin-top: 10px;"></div>
            </div>
            <script>
                jQuery(document).ready(function($) {
                    $('#test-webhook').on('click', function(e) {
                        e.preventDefault();
                        $('#test-result').html('<p>Enviando requisição...</p>');
                        
                        $.ajax({
                            url: ajaxurl,
                            type: 'POST',
                            data: {
                                action: 'test_corretor_webhook'
                            },
                            success: function(response) {
                                $('#test-result').html('<p>Resultado: ' + response + '</p>');
                            },
                            error: function() {
                                $('#test-result').html('<p>Erro ao enviar requisição.</p>');
                            }
                        });
                    });
                });
            </script>
        </div>
        <?php
    }
}

// Initialize the plugin
new CorretorSitemapUpdater();

// Add AJAX handler for testing
add_action('wp_ajax_test_corretor_webhook', 'test_corretor_webhook');
function test_corretor_webhook() {
    $updater = new CorretorSitemapUpdater();
    $updater->trigger_sitemap_update(get_the_ID(), get_post(get_the_ID()));
    echo 'Webhook enviado com sucesso!';
    wp_die();
}

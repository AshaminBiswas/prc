export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      about_page: {
        Row: {
          closing_body: string
          closing_cta_href: string
          closing_cta_label: string
          closing_eyebrow: string
          closing_heading: string
          closing_images: Json
          craft_body: string
          craft_eyebrow: string
          craft_heading: string
          craft_image: string | null
          created_at: string
          hero_eyebrow: string
          hero_image: string | null
          hero_subtitle: string
          hero_title: string
          id: string
          intro_body: string
          intro_eyebrow: string
          intro_heading: string
          is_singleton: boolean
          materials: Json
          materials_eyebrow: string
          materials_heading: string
          materials_image: string | null
          og_image: string | null
          principles: Json
          principles_eyebrow: string
          principles_heading: string
          seo_description: string | null
          seo_title: string | null
          stats: Json
          timeline: Json
          timeline_eyebrow: string
          timeline_heading: string
          updated_at: string
        }
        Insert: {
          closing_body?: string
          closing_cta_href?: string
          closing_cta_label?: string
          closing_eyebrow?: string
          closing_heading?: string
          closing_images?: Json
          craft_body?: string
          craft_eyebrow?: string
          craft_heading?: string
          craft_image?: string | null
          created_at?: string
          hero_eyebrow?: string
          hero_image?: string | null
          hero_subtitle?: string
          hero_title?: string
          id?: string
          intro_body?: string
          intro_eyebrow?: string
          intro_heading?: string
          is_singleton?: boolean
          materials?: Json
          materials_eyebrow?: string
          materials_heading?: string
          materials_image?: string | null
          og_image?: string | null
          principles?: Json
          principles_eyebrow?: string
          principles_heading?: string
          seo_description?: string | null
          seo_title?: string | null
          stats?: Json
          timeline?: Json
          timeline_eyebrow?: string
          timeline_heading?: string
          updated_at?: string
        }
        Update: {
          closing_body?: string
          closing_cta_href?: string
          closing_cta_label?: string
          closing_eyebrow?: string
          closing_heading?: string
          closing_images?: Json
          craft_body?: string
          craft_eyebrow?: string
          craft_heading?: string
          craft_image?: string | null
          created_at?: string
          hero_eyebrow?: string
          hero_image?: string | null
          hero_subtitle?: string
          hero_title?: string
          id?: string
          intro_body?: string
          intro_eyebrow?: string
          intro_heading?: string
          is_singleton?: boolean
          materials?: Json
          materials_eyebrow?: string
          materials_heading?: string
          materials_image?: string | null
          og_image?: string | null
          principles?: Json
          principles_eyebrow?: string
          principles_heading?: string
          seo_description?: string | null
          seo_title?: string | null
          stats?: Json
          timeline?: Json
          timeline_eyebrow?: string
          timeline_heading?: string
          updated_at?: string
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
        }
        Relationships: []
      }
      addresses: {
        Row: {
          alt_phone: string | null
          city: string
          country: string
          created_at: string
          full_name: string
          id: string
          is_default: boolean
          landmark: string | null
          line1: string
          line2: string | null
          phone: string
          pin_code: string
          state: string
          updated_at: string
          user_id: string
        }
        Insert: {
          alt_phone?: string | null
          city: string
          country?: string
          created_at?: string
          full_name: string
          id?: string
          is_default?: boolean
          landmark?: string | null
          line1: string
          line2?: string | null
          phone: string
          pin_code: string
          state: string
          updated_at?: string
          user_id: string
        }
        Update: {
          alt_phone?: string | null
          city?: string
          country?: string
          created_at?: string
          full_name?: string
          id?: string
          is_default?: boolean
          landmark?: string | null
          line1?: string
          line2?: string | null
          phone?: string
          pin_code?: string
          state?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      appointment_slots: {
        Row: {
          capacity: number
          created_at: string
          ends_at: string
          id: string
          is_active: boolean
          meeting_types: Database["public"]["Enums"]["appointment_meeting_type"][]
          notes: string | null
          starts_at: string
          updated_at: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          ends_at: string
          id?: string
          is_active?: boolean
          meeting_types?: Database["public"]["Enums"]["appointment_meeting_type"][]
          notes?: string | null
          starts_at: string
          updated_at?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          ends_at?: string
          id?: string
          is_active?: boolean
          meeting_types?: Database["public"]["Enums"]["appointment_meeting_type"][]
          notes?: string | null
          starts_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          account_id: string | null
          admin_notes: string | null
          company_name: string
          contact_name: string
          created_at: string
          email: string
          estimated_quantity: string | null
          id: string
          meeting_type: Database["public"]["Enums"]["appointment_meeting_type"]
          onsite_address: string | null
          phone: string
          product_interest: string | null
          project_details: string
          slot_id: string
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          account_id?: string | null
          admin_notes?: string | null
          company_name: string
          contact_name: string
          created_at?: string
          email: string
          estimated_quantity?: string | null
          id?: string
          meeting_type: Database["public"]["Enums"]["appointment_meeting_type"]
          onsite_address?: string | null
          phone: string
          product_interest?: string | null
          project_details: string
          slot_id: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          account_id?: string | null
          admin_notes?: string | null
          company_name?: string
          contact_name?: string
          created_at?: string
          email?: string
          estimated_quantity?: string | null
          id?: string
          meeting_type?: Database["public"]["Enums"]["appointment_meeting_type"]
          onsite_address?: string | null
          phone?: string
          product_interest?: string | null
          project_details?: string
          slot_id?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "appointment_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      banners: {
        Row: {
          button_link: string | null
          button_text: string | null
          created_at: string
          description: string | null
          display_order: number
          end_date: string | null
          id: string
          image_url: string | null
          mobile_image_url: string | null
          start_date: string | null
          status: string
          subtitle: string | null
          tablet_image_url: string | null
          title: string | null
          type: string
          updated_at: string
        }
        Insert: {
          button_link?: string | null
          button_text?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          end_date?: string | null
          id?: string
          image_url?: string | null
          mobile_image_url?: string | null
          start_date?: string | null
          status?: string
          subtitle?: string | null
          tablet_image_url?: string | null
          title?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          button_link?: string | null
          button_text?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          end_date?: string | null
          id?: string
          image_url?: string | null
          mobile_image_url?: string | null
          start_date?: string | null
          status?: string
          subtitle?: string | null
          tablet_image_url?: string | null
          title?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string | null
          category_id: string | null
          content: string | null
          cover_image: string | null
          created_at: string
          excerpt: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          slug: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          category_id?: string | null
          content?: string | null
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          category_id?: string | null
          content?: string | null
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          banner_url: string | null
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          material_finish: string | null
          product_id: string
          quantity: number
          updated_at: string
          user_id: string
          variant: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          material_finish?: string | null
          product_id: string
          quantity?: number
          updated_at?: string
          user_id: string
          variant?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          material_finish?: string | null
          product_id?: string
          quantity?: number
          updated_at?: string
          user_id?: string
          variant?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon_url: string | null
          id: string
          image_url: string | null
          name: string
          parent_id: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          sort_order: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          image_url?: string | null
          name: string
          parent_id?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          image_url?: string | null
          name?: string
          parent_id?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_pages: {
        Row: {
          content: Json | null
          created_at: string
          id: string
          meta_description: string | null
          meta_title: string | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: Json | null
          created_at?: string
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: Json | null
          created_at?: string
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      collections: {
        Row: {
          created_at: string
          description: string | null
          featured: boolean
          id: string
          image_url: string | null
          is_automatic: boolean
          name: string
          rules: Json | null
          slug: string
          sort_order: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          featured?: boolean
          id?: string
          image_url?: string | null
          is_automatic?: boolean
          name: string
          rules?: Json | null
          slug: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          featured?: boolean
          id?: string
          image_url?: string | null
          is_automatic?: boolean
          name?: string
          rules?: Json | null
          slug?: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          admin_notes: string | null
          company: string | null
          created_at: string
          email: string
          id: string
          is_read: boolean
          message: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          company?: string | null
          created_at?: string
          email: string
          id?: string
          is_read?: boolean
          message: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean
          message?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          applicable_categories: string[] | null
          applicable_products: string[] | null
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          expiry_date: string | null
          id: string
          max_discount: number | null
          min_purchase: number | null
          status: string
          times_used: number
          updated_at: string
          usage_limit: number | null
        }
        Insert: {
          applicable_categories?: string[] | null
          applicable_products?: string[] | null
          code: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          expiry_date?: string | null
          id?: string
          max_discount?: number | null
          min_purchase?: number | null
          status?: string
          times_used?: number
          updated_at?: string
          usage_limit?: number | null
        }
        Update: {
          applicable_categories?: string[] | null
          applicable_products?: string[] | null
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          expiry_date?: string | null
          id?: string
          max_discount?: number | null
          min_purchase?: number | null
          status?: string
          times_used?: number
          updated_at?: string
          usage_limit?: number | null
        }
        Relationships: []
      }
      materials: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          slug: string
          sort_order: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          slug: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      media_files: {
        Row: {
          created_at: string
          filename: string
          folder: string | null
          id: string
          mime_type: string | null
          path: string
          size: number | null
          tags: string[] | null
          uploaded_by: string | null
          url: string
        }
        Insert: {
          created_at?: string
          filename: string
          folder?: string | null
          id?: string
          mime_type?: string | null
          path: string
          size?: number | null
          tags?: string[] | null
          uploaded_by?: string | null
          url: string
        }
        Update: {
          created_at?: string
          filename?: string
          folder?: string | null
          id?: string
          mime_type?: string | null
          path?: string
          size?: number | null
          tags?: string[] | null
          uploaded_by?: string | null
          url?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          applicable_ids: string[] | null
          applies_to: string
          banner_url: string | null
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          end_date: string | null
          featured: boolean
          id: string
          name: string
          priority: number
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          applicable_ids?: string[] | null
          applies_to?: string
          banner_url?: string | null
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          end_date?: string | null
          featured?: boolean
          id?: string
          name: string
          priority?: number
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          applicable_ids?: string[] | null
          applies_to?: string
          banner_url?: string | null
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          end_date?: string | null
          featured?: boolean
          id?: string
          name?: string
          priority?: number
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          billing_address: Json | null
          created_at: string
          customer_id: string | null
          delivery_status: string
          discount: number
          id: string
          items: Json
          notes: string | null
          order_number: string
          payment_gateway_order_id: string | null
          payment_method: string | null
          payment_reference: string | null
          payment_status: string
          shipping: number
          shipping_address: Json | null
          status: string
          subtotal: number
          tax: number
          total: number
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          billing_address?: Json | null
          created_at?: string
          customer_id?: string | null
          delivery_status?: string
          discount?: number
          id?: string
          items?: Json
          notes?: string | null
          order_number?: string
          payment_gateway_order_id?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string
          shipping?: number
          shipping_address?: Json | null
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          billing_address?: Json | null
          created_at?: string
          customer_id?: string | null
          delivery_status?: string
          discount?: number
          id?: string
          items?: Json
          notes?: string | null
          order_number?: string
          payment_gateway_order_id?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string
          shipping?: number
          shipping_address?: Json | null
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pending_orders: {
        Row: {
          billing_address: Json
          created_at: string
          customer_id: string
          finalized_order_id: string | null
          id: string
          items: Json
          payment_method: string
          razorpay_order_id: string
          shipping: number
          shipping_address: Json
          status: string
          subtotal: number
          tax: number
          total: number
          updated_at: string
        }
        Insert: {
          billing_address: Json
          created_at?: string
          customer_id: string
          finalized_order_id?: string | null
          id?: string
          items: Json
          payment_method: string
          razorpay_order_id: string
          shipping: number
          shipping_address: Json
          status?: string
          subtotal: number
          tax: number
          total: number
          updated_at?: string
        }
        Update: {
          billing_address?: Json
          created_at?: string
          customer_id?: string
          finalized_order_id?: string | null
          id?: string
          items?: Json
          payment_method?: string
          razorpay_order_id?: string
          shipping?: number
          shipping_address?: Json
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_orders_finalized_order_id_fkey"
            columns: ["finalized_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          best_seller: boolean
          brand_id: string | null
          brochure_url: string | null
          category_id: string | null
          collection_id: string | null
          created_at: string
          description: string | null
          dimensions: Json | null
          featured: boolean
          finish: string | null
          gst: number | null
          hsn: string | null
          id: string
          images: string[] | null
          install_guide_url: string | null
          material_id: string | null
          min_stock: number
          mrp: number | null
          name: string
          offer_price: number | null
          og_image: string | null
          price: number
          seo_description: string | null
          seo_title: string | null
          short_description: string | null
          sku: string | null
          slug: string
          specifications: Json | null
          status: string
          stock: number
          subcategory_id: string | null
          tags: string[] | null
          trending: boolean
          updated_at: string
          videos: string[] | null
          visibility: string
          warranty: string | null
          weight: number | null
        }
        Insert: {
          barcode?: string | null
          best_seller?: boolean
          brand_id?: string | null
          brochure_url?: string | null
          category_id?: string | null
          collection_id?: string | null
          created_at?: string
          description?: string | null
          dimensions?: Json | null
          featured?: boolean
          finish?: string | null
          gst?: number | null
          hsn?: string | null
          id?: string
          images?: string[] | null
          install_guide_url?: string | null
          material_id?: string | null
          min_stock?: number
          mrp?: number | null
          name: string
          offer_price?: number | null
          og_image?: string | null
          price?: number
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          sku?: string | null
          slug: string
          specifications?: Json | null
          status?: string
          stock?: number
          subcategory_id?: string | null
          tags?: string[] | null
          trending?: boolean
          updated_at?: string
          videos?: string[] | null
          visibility?: string
          warranty?: string | null
          weight?: number | null
        }
        Update: {
          barcode?: string | null
          best_seller?: boolean
          brand_id?: string | null
          brochure_url?: string | null
          category_id?: string | null
          collection_id?: string | null
          created_at?: string
          description?: string | null
          dimensions?: Json | null
          featured?: boolean
          finish?: string | null
          gst?: number | null
          hsn?: string | null
          id?: string
          images?: string[] | null
          install_guide_url?: string | null
          material_id?: string | null
          min_stock?: number
          mrp?: number | null
          name?: string
          offer_price?: number | null
          og_image?: string | null
          price?: number
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          sku?: string | null
          slug?: string
          specifications?: Json | null
          status?: string
          stock?: number
          subcategory_id?: string | null
          tags?: string[] | null
          trending?: boolean
          updated_at?: string
          videos?: string[] | null
          visibility?: string
          warranty?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_id: string
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          url_hash: string | null
        }
        Insert: {
          account_id: string
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
          url_hash?: string | null
        }
        Update: {
          account_id?: string
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          url_hash?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          gallery: Json
          grid_span: string
          id: string
          is_published: boolean
          location: string
          related_sectors: string[]
          scope: string
          sector: string
          slug: string
          sort_order: number
          title: string
          updated_at: string
          year: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          gallery?: Json
          grid_span?: string
          id?: string
          is_published?: boolean
          location: string
          related_sectors?: string[]
          scope: string
          sector: string
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
          year: string
        }
        Update: {
          created_at?: string
          description?: string | null
          gallery?: Json
          grid_span?: string
          id?: string
          is_published?: boolean
          location?: string
          related_sectors?: string[]
          scope?: string
          sector?: string
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
          year?: string
        }
        Relationships: []
      }
      razorpay_webhook_events: {
        Row: {
          created_at: string
          event_type: string | null
          finalized_order_id: string | null
          id: string
          note: string | null
          outcome: string
          payload: Json | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          signature_valid: boolean
        }
        Insert: {
          created_at?: string
          event_type?: string | null
          finalized_order_id?: string | null
          id?: string
          note?: string | null
          outcome: string
          payload?: Json | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          signature_valid?: boolean
        }
        Update: {
          created_at?: string
          event_type?: string | null
          finalized_order_id?: string | null
          id?: string
          note?: string | null
          outcome?: string
          payload?: Json | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          signature_valid?: boolean
        }
        Relationships: []
      }
      reviews: {
        Row: {
          admin_reply: string | null
          comment: string | null
          created_at: string
          customer_id: string | null
          featured: boolean
          id: string
          images: string[] | null
          product_id: string
          rating: number
          status: string
          title: string | null
          updated_at: string
          verified_purchase: boolean
        }
        Insert: {
          admin_reply?: string | null
          comment?: string | null
          created_at?: string
          customer_id?: string | null
          featured?: boolean
          id?: string
          images?: string[] | null
          product_id: string
          rating: number
          status?: string
          title?: string | null
          updated_at?: string
          verified_purchase?: boolean
        }
        Update: {
          admin_reply?: string | null
          comment?: string | null
          created_at?: string
          customer_id?: string | null
          featured?: boolean
          id?: string
          images?: string[] | null
          product_id?: string
          rating?: number
          status?: string
          title?: string | null
          updated_at?: string
          verified_purchase?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          is_public: boolean
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          is_public?: boolean
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          is_public?: boolean
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      warranty_claims: {
        Row: {
          contact_email: string
          created_at: string
          id: string
          issue: string
          order_id: string
          product: string
          purchase_date: string
          status: string
          updated_at: string
        }
        Insert: {
          contact_email: string
          created_at?: string
          id?: string
          issue: string
          order_id: string
          product: string
          purchase_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          contact_email?: string
          created_at?: string
          id?: string
          issue?: string
          order_id?: string
          product?: string
          purchase_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      compute_profile_url_hash: {
        Args: { _account_id: string }
        Returns: string
      }
      generate_account_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      normalize_phone: { Args: { _raw: string }; Returns: string }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "manager"
        | "sales_manager"
        | "inventory_manager"
        | "content_manager"
        | "customer_support"
        | "marketing_manager"
      appointment_meeting_type:
        | "video"
        | "phone"
        | "factory_visit"
        | "showroom_visit"
        | "onsite_visit"
      appointment_status:
        | "pending"
        | "confirmed"
        | "rescheduled"
        | "completed"
        | "cancelled"
        | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "super_admin",
        "manager",
        "sales_manager",
        "inventory_manager",
        "content_manager",
        "customer_support",
        "marketing_manager",
      ],
      appointment_meeting_type: [
        "video",
        "phone",
        "factory_visit",
        "showroom_visit",
        "onsite_visit",
      ],
      appointment_status: [
        "pending",
        "confirmed",
        "rescheduled",
        "completed",
        "cancelled",
        "rejected",
      ],
    },
  },
} as const
